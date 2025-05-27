/**
 * Script to deploy the database schema for TrueID
 * This script reads the database.sql file and executes it against the PostgreSQL database
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection configuration
const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'password_here',
  port: 5432,
};

// Create a new pool instance
const pool = new Pool(dbConfig);

// Path to the database schema file
const schemaFilePath = path.join(__dirname, 'config', 'database.sql');

async function deploySchema() {
  console.log('Reading schema file...');
  const schemaSQL = fs.readFileSync(schemaFilePath, 'utf8');
  
  console.log('Connecting to database...');
  const client = await pool.connect();
  
  try {
    console.log('Beginning transaction...');
    await client.query('BEGIN');
    
    console.log('Executing schema...');
    await client.query(schemaSQL);
    
    console.log('Committing transaction...');
    await client.query('COMMIT');
    
    console.log('Schema deployed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deploying schema:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Execute the deployment
deploySchema()
  .then(() => {
    console.log('Database schema deployment completed.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed to deploy database schema:', err);
    process.exit(1);
  });
