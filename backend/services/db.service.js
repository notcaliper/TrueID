/**
 * Database service for TrueID
 * Provides connection pooling, retry logic, and circuit breaking
 */

const { Pool } = require('pg');
const config = require('../config/config');
const EventEmitter = require('events');

class DatabaseService extends EventEmitter {
  constructor() {
    super();
    this.connectionActive = false;
    this.failureCount = 0;
    this.lastError = null;
    this.circuitBroken = false;
    this.circuitResetTimeout = null;
    this.inMemoryCache = {
      users: new Map(),
      verificationStatuses: new Map(),
      walletAddresses: new Map(),
      blockchainStatuses: new Map(),
      lastUpdated: null
    };
    
    // Initialize the connection pool
    this.initPool().catch(err => {
      console.error('Failed to initialize database pool:', err);
      this.handleConnectionError(err);
    });
  }
  
  async initPool() {
    try {
      // Create a new pool with better timeout settings
      this.pool = new Pool({
        user: config.DB_USER,
        host: config.DB_HOST,
        database: config.DB_NAME,
        password: config.DB_PASSWORD,
        port: config.DB_PORT,
        max: 20,
        idleTimeoutMillis: 60000, // 1 minute idle timeout
        connectionTimeoutMillis: 10000, // 10 second connection timeout
        keepAlive: true, // Enable TCP keepalive
        keepAliveInitialDelayMillis: 30000 // 30 seconds
      });

      // Add pool error handler
      this.pool.on('error', (err, client) => {
        console.error('Unexpected error on idle client', err);
        this.handleConnectionError(err);
      });

      // Test the connection
      await this.testConnection();
      
      // Start periodic connection testing with exponential backoff
      let retryInterval = 5000; // Start with 5 seconds
      const maxInterval = 30000; // Max 30 seconds
      
      const scheduleNextTest = () => {
        setTimeout(async () => {
          try {
            await this.testConnection();
            retryInterval = 5000; // Reset on success
          } catch (err) {
            console.error('Periodic connection test failed:', err);
            this.handleConnectionError(err);
            retryInterval = Math.min(retryInterval * 1.5, maxInterval);
          }
          scheduleNextTest();
        }, retryInterval);
      };
      
      scheduleNextTest();
      return true;
    } catch (err) {
      console.error('Failed to initialize pool:', err);
      this.handleConnectionError(err);
      return false;
    }
  }
  
  async testConnection() {
    if (!this.pool) {
      console.error('Pool is not initialized');
      return false;
    }

    try {
      const client = await this.pool.connect();
      try {
        const result = await client.query('SELECT NOW()');
        if (result.rows.length > 0) {
          if (!this.connectionActive) {
            console.log('Database connected successfully:', result.rows[0]);
            this.connectionActive = true;
            this.failureCount = 0;
            this.circuitBroken = false;
            this.emit('connected');
          }
          return true;
        }
        return false;
      } finally {
        client.release();
      }
    } catch (err) {
      this.handleConnectionError(err);
      return false;
    }
  }
  
  handleConnectionError(err) {
    const wasActive = this.connectionActive;
    this.connectionActive = false;
    this.lastError = err;
    this.failureCount++;
    
    // If we've failed too many times, break the circuit
    if (this.failureCount >= 3 && !this.circuitBroken) {
      this.circuitBroken = true;
      console.error('Circuit breaker tripped after', this.failureCount, 'failures');
      
      // Try to reset after a delay with exponential backoff
      if (this.circuitResetTimeout) {
        clearTimeout(this.circuitResetTimeout);
      }
      
      const resetDelay = Math.min(Math.pow(2, this.failureCount) * 1000, 30000); // Max 30 seconds
      
      this.circuitResetTimeout = setTimeout(async () => {
        console.log('Attempting to reset circuit breaker...');
        this.circuitBroken = false;
        try {
          // Try to reinitialize the pool
          if (this.pool) {
            await this.pool.end();
          }
          await this.initPool();
        } catch (initErr) {
          console.error('Failed to reinitialize pool:', initErr);
          this.handleConnectionError(initErr);
        }
      }, resetDelay);
    }
    
    // Only emit error if this is a new failure
    if (wasActive) {
      this.emit('error', err);
    }
  }
  
  async query(text, params = []) {
    // If circuit is broken, use fallback immediately
    if (this.circuitBroken) {
      throw new Error('Circuit breaker active - database unavailable');
    }
    
    try {
      const start = Date.now();
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries
      if (duration > 500) {
        console.log('Slow query:', { text, duration, rows: res.rowCount });
      }
      
      return res;
    } catch (err) {
      this.handleConnectionError(err);
      throw err;
    }
  }
  
  // Wrapper function with fallback support
  async withFallback(operation, fallback) {
    try {
      // Try to execute the database operation
      return await operation();
    } catch (err) {
      console.error('Database operation failed:', err);
      
      // If a fallback function is provided, use it
      if (typeof fallback === 'function') {
        console.log('Using fallback mechanism for database operation');
        return fallback();
      }
      
      // Otherwise, rethrow the error
      throw err;
    }
  }
  
  // Cache management functions
  updateCache(key, id, data) {
    if (!this.inMemoryCache[key]) {
      this.inMemoryCache[key] = new Map();
    }
    
    this.inMemoryCache[key].set(id, data);
    this.inMemoryCache.lastUpdated = new Date();
  }
  
  getFromCache(key, id) {
    if (!this.inMemoryCache[key]) {
      return null;
    }
    
    return this.inMemoryCache[key].get(id);
  }
  
  clearCache() {
    Object.keys(this.inMemoryCache).forEach(key => {
      if (key !== 'lastUpdated') {
        this.inMemoryCache[key] = new Map();
      }
    });
    
    this.inMemoryCache.lastUpdated = new Date();
  }
  
  /**
   * Check if the database is connected and circuit is not broken
   * @returns {boolean} True if connected and circuit is not broken
   */
  getConnectionStatus() {
    return this.connectionActive && !this.circuitBroken;
  }
}

// Create and export a singleton instance
const dbService = new DatabaseService();
module.exports = dbService;
