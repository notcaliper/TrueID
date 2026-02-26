/**
 * TrueID Performance Benchmark Script
 * =====================================
 * Measures and reports timing metrics for all critical system operations:
 *   - Face/Biometric Authentication Rate & Latency
 *   - Blockchain Transaction Time & Throughput
 *   - User Registration & Login Latency
 *   - Admin Verification Pipeline Timing
 *   - Professional Record CRUD Latency
 *   - Document Upload Latency
 *   - API Response Times (P50, P95, P99)
 *
 * Usage:
 *   node test-performance-benchmark.js
 *
 * Prerequisites:
 *   - Backend server running on port 5000
 *   - Admin account (admin2 / SecurePass123)
 *   - PostgreSQL database connected
 *   - Avalanche Fuji testnet configured (for blockchain tests)
 */

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ─── Configuration ───────────────────────────────────────────────────────────

const API_URL = 'http://localhost:5000/api';
const ITERATIONS = {
  biometricVerification: 5,   // Number of biometric verify attempts
  loginAttempts: 5,           // Number of login round-trips
  profileFetches: 10,         // Number of profile GET requests
  blockchainStatusChecks: 5,  // Number of blockchain status checks
};

const ADMIN_CREDENTIALS = { username: 'admin2', password: 'SecurePass123' };
const TEST_TIMESTAMP = Date.now();

// ─── Utilities ───────────────────────────────────────────────────────────────

/** High-resolution timer wrapper — returns elapsed ms */
async function measureMs(fn) {
  const start = process.hrtime.bigint();
  const result = await fn();
  const end = process.hrtime.bigint();
  const ms = Number(end - start) / 1e6; // nanoseconds → ms
  return { result, ms };
}

/** Run a function N times and collect timings */
async function benchmark(label, fn, iterations = 1) {
  const timings = [];
  const results = [];
  let successes = 0;
  let failures = 0;

  for (let i = 0; i < iterations; i++) {
    try {
      const { result, ms } = await measureMs(fn);
      timings.push(ms);
      results.push({ iteration: i + 1, ms, success: true });
      successes++;
    } catch (err) {
      const errMsg = err.response
        ? `${err.response.status}: ${JSON.stringify(err.response.data)}`
        : err.message;
      results.push({ iteration: i + 1, ms: null, success: false, error: errMsg });
      failures++;
    }
  }

  const stats = computeStats(timings);
  return { label, iterations, successes, failures, timings, stats, results };
}

/** Compute statistical summary from an array of numbers */
function computeStats(arr) {
  if (arr.length === 0) return { min: 0, max: 0, mean: 0, median: 0, p95: 0, p99: 0, stddev: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / sorted.length;
  const median = percentile(sorted, 50);
  const p95 = percentile(sorted, 95);
  const p99 = percentile(sorted, 99);
  const variance = sorted.reduce((acc, v) => acc + (v - mean) ** 2, 0) / sorted.length;
  const stddev = Math.sqrt(variance);
  return {
    count: sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean,
    median,
    p95,
    p99,
    stddev,
  };
}

function percentile(sorted, pct) {
  if (sorted.length === 0) return 0;
  const idx = (pct / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

/** Format ms nicely */
function fmtMs(ms) {
  if (ms == null) return 'N/A';
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/** Authenticated request helper */
async function apiRequest(method, endpoint, data = null, token = null, timeout = 30000) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await axios({ method, url: `${API_URL}${endpoint}`, data, headers, timeout });
  return response.data;
}

/** Generate mock facemesh data */
function generateFacemeshData() {
  const landmarks = [];
  for (let i = 0; i < 468; i++) {
    landmarks.push({
      x: Math.random(),
      y: Math.random(),
      z: Math.random() * 0.1,
    });
  }
  return { landmarks };
}

// ─── Benchmark Sections ──────────────────────────────────────────────────────

const allBenchmarks = {};
let userTokens = null;
let userData = null;
let adminTokens = null;
let professionalRecordId = null;

// 1) Server Health Check
async function benchHealthCheck() {
  console.log('\n🔍 Checking server health...');
  try {
    const { ms } = await measureMs(() => axios.get(`${API_URL}/health`, { timeout: 5000 }));
    console.log(`  Server responded in ${fmtMs(ms)}`);
    return true;
  } catch (err) {
    if (err.response) {
      console.log('  Server is running (health endpoint returned an error but server is up)');
      return true;
    }
    console.error('  ❌ Server is not running on port 5000. Start it first: cd backend && npm start');
    return false;
  }
}

// 2) User Registration Benchmark
async function benchUserRegistration() {
  console.log('\n📝 Benchmarking: User Registration');

  const mockUser = {
    name: 'Perf Test User',
    username: `perftest_${TEST_TIMESTAMP}`,
    password: 'Password123!',
    email: `perftest_${TEST_TIMESTAMP}@example.com`,
    phone: '+12025550199',
    governmentId: `GOV${TEST_TIMESTAMP}`,
    facemeshData: generateFacemeshData(),
  };

  const result = await benchmark('User Registration', async () => {
    const resp = await apiRequest('post', '/user/register', mockUser);
    userTokens = resp.tokens;
    userData = resp.user;
    return resp;
  }, 1);

  allBenchmarks['User Registration'] = result;
  printBenchResult(result);
}

// 3) User Login Benchmark (multiple iterations)
async function benchUserLogin() {
  console.log('\n🔐 Benchmarking: User Login');

  const loginData = {
    username: `perftest_${TEST_TIMESTAMP}`,
    password: 'Password123!',
  };

  const result = await benchmark('User Login', async () => {
    const resp = await apiRequest('post', '/user/login', loginData);
    userTokens = resp.tokens;
    userData = resp.user;
    return resp;
  }, ITERATIONS.loginAttempts);

  allBenchmarks['User Login'] = result;
  printBenchResult(result);
}

// 4) Biometric/Face Authentication Benchmark
async function benchBiometricVerification() {
  console.log('\n🧬 Benchmarking: Face/Biometric Authentication');

  // 4a) Biometric status check
  const statusResult = await benchmark('Biometric Status Check', async () => {
    return await apiRequest('get', '/users/biometric-status', null, userTokens.accessToken);
  }, ITERATIONS.biometricVerification);

  allBenchmarks['Biometric Status Check'] = statusResult;
  printBenchResult(statusResult);

  // 4b) Biometric verification (face match)
  const verifyResult = await benchmark('Biometric Verification (Face Match)', async () => {
    return await apiRequest('post', '/user/verify-biometric', {
      userId: userData.id,
      facemeshData: generateFacemeshData(),
    }, userTokens.accessToken);
  }, ITERATIONS.biometricVerification);

  allBenchmarks['Biometric Verification (Face Match)'] = verifyResult;
  printBenchResult(verifyResult);

  // 4c) Facemesh update
  const updateResult = await benchmark('Facemesh Data Update', async () => {
    return await apiRequest('put', '/users/update-facemesh', {
      facemeshData: generateFacemeshData(),
    }, userTokens.accessToken);
  }, 3);

  allBenchmarks['Facemesh Data Update'] = updateResult;
  printBenchResult(updateResult);
}

// 5) Profile Fetch Benchmark (API latency baseline)
async function benchProfileFetch() {
  console.log('\n👤 Benchmarking: Profile Fetch (API Latency Baseline)');

  const result = await benchmark('Profile Fetch (GET)', async () => {
    return await apiRequest('get', '/users/profile', null, userTokens.accessToken);
  }, ITERATIONS.profileFetches);

  allBenchmarks['Profile Fetch (GET)'] = result;
  printBenchResult(result);
}

// 6) Admin Login Benchmark
async function benchAdminLogin() {
  console.log('\n🛡️  Benchmarking: Admin Login');

  const result = await benchmark('Admin Login', async () => {
    const resp = await apiRequest('post', '/admin/login', ADMIN_CREDENTIALS);
    adminTokens = resp.tokens;
    return resp;
  }, 3);

  allBenchmarks['Admin Login'] = result;
  printBenchResult(result);
}

// 7) Admin Verification Pipeline (heaviest endpoint — 2 blockchain txs)
async function benchAdminVerification() {
  console.log('\n✅ Benchmarking: Admin User Verification (Blockchain Pipeline)');
  console.log('  ⚠️  This includes: AVAX wallet funding + identity registration on-chain');

  const result = await benchmark('Admin Verify User (Full Pipeline)', async () => {
    // Find the test user
    const usersResp = await apiRequest('get', '/admin/users', null, adminTokens.accessToken);
    const testUser = usersResp.users.find(u => u.username === `perftest_${TEST_TIMESTAMP}`);
    if (!testUser) throw new Error('Test user not found');

    // Verify the user — triggers wallet funding + blockchain registration
    const verifyResp = await axios.put(
      `${API_URL}/admin/users/${testUser.id}/verify`,
      { verificationStatus: 'VERIFIED', notes: 'Performance benchmark test' },
      {
        headers: { Authorization: `Bearer ${adminTokens.accessToken}` },
        timeout: 120000, // 2 min — blockchain txs can be slow
      }
    );
    return verifyResp.data;
  }, 1);

  allBenchmarks['Admin Verify User (Full Pipeline)'] = result;
  printBenchResult(result);
}

// 8) Blockchain Status Check Benchmark
async function benchBlockchainStatus() {
  console.log('\n⛓️  Benchmarking: Blockchain Status Queries');

  // Re-login as user to refresh tokens
  try {
    const loginResp = await apiRequest('post', '/user/login', {
      username: `perftest_${TEST_TIMESTAMP}`,
      password: 'Password123!',
    });
    userTokens = loginResp.tokens;
    userData = loginResp.user;
  } catch (e) {
    console.log('  Could not re-login, using existing tokens');
  }

  const statusResult = await benchmark('Blockchain Status Check', async () => {
    return await apiRequest('get', '/blockchain/status', null, userTokens.accessToken);
  }, ITERATIONS.blockchainStatusChecks);

  allBenchmarks['Blockchain Status Check'] = statusResult;
  printBenchResult(statusResult);

  // Blockchain expiry check
  const expiryResult = await benchmark('Blockchain Expiry Check', async () => {
    return await apiRequest('get', '/blockchain/expiry', null, userTokens.accessToken);
  }, 3);

  allBenchmarks['Blockchain Expiry Check'] = expiryResult;
  printBenchResult(expiryResult);

  // Transaction history
  const txResult = await benchmark('Transaction History Fetch', async () => {
    return await apiRequest('get', '/blockchain/transactions', null, userTokens.accessToken);
  }, 3);

  allBenchmarks['Transaction History Fetch'] = txResult;
  printBenchResult(txResult);
}

// 9) Professional Record CRUD Benchmark
async function benchProfessionalRecords() {
  console.log('\n📋 Benchmarking: Professional Record Operations');

  // Create
  const createResult = await benchmark('Professional Record — Create', async () => {
    const resp = await apiRequest('post', '/users/professional-record', {
      title: `Benchmark Record ${Date.now()}`,
      recordType: 'EMPLOYMENT',
      institution: 'Benchmark Corp',
      startDate: '2023-01-01',
      endDate: '2024-01-01',
      description: 'Performance benchmark test record',
      isCurrent: false,
    }, userTokens.accessToken);
    professionalRecordId = resp.record?.id || professionalRecordId;
    return resp;
  }, 3);

  allBenchmarks['Professional Record — Create'] = createResult;
  printBenchResult(createResult);

  // Read all
  const readResult = await benchmark('Professional Record — List All', async () => {
    return await apiRequest('get', '/users/professional-records', null, userTokens.accessToken);
  }, 5);

  allBenchmarks['Professional Record — List All'] = readResult;
  printBenchResult(readResult);

  // Update
  if (professionalRecordId) {
    const updateResult = await benchmark('Professional Record — Update', async () => {
      return await apiRequest('put', `/users/professional-record/${professionalRecordId}`, {
        title: `Updated Benchmark Record ${Date.now()}`,
        description: 'Updated via performance benchmark',
      }, userTokens.accessToken);
    }, 3);

    allBenchmarks['Professional Record — Update'] = updateResult;
    printBenchResult(updateResult);
  }
}

// 10) Blockchain Transfer (User-initiated)
async function benchBlockchainTransfer() {
  console.log('\n🚀 Benchmarking: Blockchain Identity Transfer (User-initiated)');

  const result = await benchmark('Blockchain Identity Transfer', async () => {
    return await apiRequest('post', '/users/transfer-to-blockchain', {}, userTokens.accessToken, 120000);
  }, 1);

  allBenchmarks['Blockchain Identity Transfer'] = result;
  printBenchResult(result);
}

// 11) Verification Status Fetch
async function benchVerificationStatus() {
  console.log('\n📊 Benchmarking: Verification Status Fetch');

  const result = await benchmark('Verification Status Fetch', async () => {
    return await apiRequest('get', '/users/verification-status', null, userTokens.accessToken);
  }, 5);

  allBenchmarks['Verification Status Fetch'] = result;
  printBenchResult(result);
}

// 12) Admin Dashboard Stats
async function benchAdminDashboard() {
  console.log('\n📈 Benchmarking: Admin Dashboard Stats');

  const result = await benchmark('Admin Dashboard Stats', async () => {
    return await apiRequest('get', '/admin/dashboard/stats', null, adminTokens.accessToken);
  }, 3);

  allBenchmarks['Admin Dashboard Stats'] = result;
  printBenchResult(result);
}

// ─── Reporting ───────────────────────────────────────────────────────────────

function printBenchResult(bench) {
  const s = bench.stats;
  const rate = bench.successes > 0 ? ((bench.successes / bench.iterations) * 100).toFixed(1) : '0.0';
  console.log(`  ┌─ ${bench.label}`);
  console.log(`  │  Iterations: ${bench.iterations}  |  Success: ${bench.successes}  |  Failed: ${bench.failures}  |  Rate: ${rate}%`);
  if (s.count > 0) {
    console.log(`  │  Min: ${fmtMs(s.min)}  |  Max: ${fmtMs(s.max)}  |  Mean: ${fmtMs(s.mean)}  |  Median: ${fmtMs(s.median)}`);
    console.log(`  │  P95: ${fmtMs(s.p95)}  |  P99: ${fmtMs(s.p99)}  |  StdDev: ${fmtMs(s.stddev)}`);
    if (s.mean > 0) {
      const throughput = (1000 / s.mean).toFixed(2);
      console.log(`  │  Throughput: ~${throughput} ops/sec`);
    }
  }
  console.log(`  └──────────────────────────────────────`);
}

function generateFinalReport() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    TRUEID PERFORMANCE BENCHMARK REPORT                      ║');
  console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
  console.log(`║  Test ID   : ${TEST_TIMESTAMP}                                        ║`);
  console.log(`║  Date      : ${new Date().toISOString()}                      ║`);
  console.log(`║  Server    : ${API_URL}                              ║`);
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');

  // ── Category: Authentication & Biometrics ──
  console.log('\n┌─────────────────────────────────────────────────────────────────────────────┐');
  console.log('│              🧬  FACE / BIOMETRIC AUTHENTICATION METRICS                    │');
  console.log('├──────────────────────────────────┬──────────┬──────────┬──────────┬──────────┤');
  console.log('│ Operation                        │  Mean    │  P95     │  Rate    │ Ops/sec  │');
  console.log('├──────────────────────────────────┼──────────┼──────────┼──────────┼──────────┤');

  const bioKeys = ['Biometric Status Check', 'Biometric Verification (Face Match)', 'Facemesh Data Update'];
  bioKeys.forEach(key => printTableRow(key));

  console.log('└──────────────────────────────────┴──────────┴──────────┴──────────┴──────────┘');

  // ── Category: Blockchain ──
  console.log('\n┌─────────────────────────────────────────────────────────────────────────────┐');
  console.log('│              ⛓️   BLOCKCHAIN TRANSACTION METRICS                             │');
  console.log('├──────────────────────────────────┬──────────┬──────────┬──────────┬──────────┤');
  console.log('│ Operation                        │  Mean    │  P95     │  Rate    │ Ops/sec  │');
  console.log('├──────────────────────────────────┼──────────┼──────────┼──────────┼──────────┤');

  const bcKeys = [
    'Admin Verify User (Full Pipeline)',
    'Blockchain Identity Transfer',
    'Blockchain Status Check',
    'Blockchain Expiry Check',
    'Transaction History Fetch',
  ];
  bcKeys.forEach(key => printTableRow(key));

  console.log('└──────────────────────────────────┴──────────┴──────────┴──────────┴──────────┘');

  // ── Category: User Operations ──
  console.log('\n┌─────────────────────────────────────────────────────────────────────────────┐');
  console.log('│              👤  USER OPERATION METRICS                                      │');
  console.log('├──────────────────────────────────┬──────────┬──────────┬──────────┬──────────┤');
  console.log('│ Operation                        │  Mean    │  P95     │  Rate    │ Ops/sec  │');
  console.log('├──────────────────────────────────┼──────────┼──────────┼──────────┼──────────┤');

  const userKeys = [
    'User Registration',
    'User Login',
    'Profile Fetch (GET)',
    'Verification Status Fetch',
  ];
  userKeys.forEach(key => printTableRow(key));

  console.log('└──────────────────────────────────┴──────────┴──────────┴──────────┴──────────┘');

  // ── Category: Professional Records ──
  console.log('\n┌─────────────────────────────────────────────────────────────────────────────┐');
  console.log('│              📋  PROFESSIONAL RECORD METRICS                                 │');
  console.log('├──────────────────────────────────┬──────────┬──────────┬──────────┬──────────┤');
  console.log('│ Operation                        │  Mean    │  P95     │  Rate    │ Ops/sec  │');
  console.log('├──────────────────────────────────┼──────────┼──────────┼──────────┼──────────┤');

  const recKeys = [
    'Professional Record — Create',
    'Professional Record — List All',
    'Professional Record — Update',
  ];
  recKeys.forEach(key => printTableRow(key));

  console.log('└──────────────────────────────────┴──────────┴──────────┴──────────┴──────────┘');

  // ── Category: Admin ──
  console.log('\n┌─────────────────────────────────────────────────────────────────────────────┐');
  console.log('│              🛡️   ADMIN OPERATION METRICS                                    │');
  console.log('├──────────────────────────────────┬──────────┬──────────┬──────────┬──────────┤');
  console.log('│ Operation                        │  Mean    │  P95     │  Rate    │ Ops/sec  │');
  console.log('├──────────────────────────────────┼──────────┼──────────┼──────────┼──────────┤');

  const adminKeys = ['Admin Login', 'Admin Dashboard Stats'];
  adminKeys.forEach(key => printTableRow(key));

  console.log('└──────────────────────────────────┴──────────┴──────────┴──────────┴──────────┘');

  // ── Summary ──
  const totalOps = Object.values(allBenchmarks).reduce((a, b) => a + b.iterations, 0);
  const totalSuccesses = Object.values(allBenchmarks).reduce((a, b) => a + b.successes, 0);
  const totalFailures = Object.values(allBenchmarks).reduce((a, b) => a + b.failures, 0);
  const overallRate = totalOps > 0 ? ((totalSuccesses / totalOps) * 100).toFixed(1) : '0.0';

  // Find slowest & fastest
  let slowest = { label: 'N/A', mean: 0 };
  let fastest = { label: 'N/A', mean: Infinity };
  Object.values(allBenchmarks).forEach(b => {
    if (b.stats.mean > slowest.mean && b.stats.count > 0) slowest = { label: b.label, mean: b.stats.mean };
    if (b.stats.mean < fastest.mean && b.stats.count > 0) fastest = { label: b.label, mean: b.stats.mean };
  });

  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                           OVERALL SUMMARY                                   ║');
  console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
  console.log(`║  Total Operations       : ${totalOps}`);
  console.log(`║  Successful             : ${totalSuccesses}`);
  console.log(`║  Failed                 : ${totalFailures}`);
  console.log(`║  Overall Success Rate   : ${overallRate}%`);
  console.log(`║  Fastest Operation      : ${fastest.label} (${fmtMs(fastest.mean)})`);
  console.log(`║  Slowest Operation      : ${slowest.label} (${fmtMs(slowest.mean)})`);
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
}

function printTableRow(key) {
  const b = allBenchmarks[key];
  if (!b) {
    const padded = key.substring(0, 32).padEnd(32);
    console.log(`│ ${padded} │   N/A    │   N/A    │   N/A    │   N/A    │`);
    return;
  }
  const s = b.stats;
  const rate = b.iterations > 0 ? ((b.successes / b.iterations) * 100).toFixed(0) + '%' : 'N/A';
  const ops = s.mean > 0 ? (1000 / s.mean).toFixed(1) : 'N/A';
  const padded = key.substring(0, 32).padEnd(32);
  console.log(`│ ${padded} │ ${fmtMs(s.mean).padStart(8)} │ ${fmtMs(s.p95).padStart(8)} │ ${rate.padStart(8)} │ ${String(ops).padStart(8)} │`);
}

function saveReport() {
  const reportData = {
    testId: TEST_TIMESTAMP,
    date: new Date().toISOString(),
    server: API_URL,
    benchmarks: {},
    summary: {},
  };

  Object.entries(allBenchmarks).forEach(([key, b]) => {
    reportData.benchmarks[key] = {
      iterations: b.iterations,
      successes: b.successes,
      failures: b.failures,
      successRate: b.iterations > 0 ? ((b.successes / b.iterations) * 100).toFixed(1) + '%' : '0%',
      stats: {
        min_ms: b.stats.min ? +b.stats.min.toFixed(2) : null,
        max_ms: b.stats.max ? +b.stats.max.toFixed(2) : null,
        mean_ms: b.stats.mean ? +b.stats.mean.toFixed(2) : null,
        median_ms: b.stats.median ? +b.stats.median.toFixed(2) : null,
        p95_ms: b.stats.p95 ? +b.stats.p95.toFixed(2) : null,
        p99_ms: b.stats.p99 ? +b.stats.p99.toFixed(2) : null,
        stddev_ms: b.stats.stddev ? +b.stats.stddev.toFixed(2) : null,
        throughput_ops_per_sec: b.stats.mean > 0 ? +(1000 / b.stats.mean).toFixed(2) : null,
      },
      rawTimings_ms: b.timings.map(t => +t.toFixed(2)),
    };
  });

  const totalOps = Object.values(allBenchmarks).reduce((a, b) => a + b.iterations, 0);
  const totalSuccesses = Object.values(allBenchmarks).reduce((a, b) => a + b.successes, 0);
  reportData.summary = {
    totalOperations: totalOps,
    totalSuccesses,
    totalFailures: totalOps - totalSuccesses,
    overallSuccessRate: totalOps > 0 ? ((totalSuccesses / totalOps) * 100).toFixed(1) + '%' : '0%',
  };

  const dir = path.join(__dirname, 'test-results');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, `benchmark-${TEST_TIMESTAMP}.json`);
  fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2));
  console.log(`\n📁 Full benchmark data saved to: ${filePath}`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              TRUEID PERFORMANCE BENCHMARK — Starting...                     ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');

  // Pre-flight
  const serverUp = await benchHealthCheck();
  if (!serverUp) return process.exit(1);

  try {
    // Phase 1 — User auth operations
    await benchUserRegistration();
    await benchUserLogin();

    // Phase 2 — Biometric / Face Authentication
    await benchBiometricVerification();

    // Phase 3 — API latency baseline
    await benchProfileFetch();
    await benchVerificationStatus();

    // Phase 4 — Professional records
    await benchProfessionalRecords();

    // Phase 5 — Admin operations
    await benchAdminLogin();
    await benchAdminDashboard();

    // Phase 6 — Admin verification pipeline (blockchain-heavy)
    await benchAdminVerification();

    // Phase 7 — Blockchain queries & transfer
    await benchBlockchainStatus();
    await benchBlockchainTransfer();

  } catch (err) {
    console.error(`\n❌ Benchmark halted due to critical error: ${err.message}`);
    if (err.response) {
      console.error(`  Status: ${err.response.status}`);
      console.error(`  Data: ${JSON.stringify(err.response.data)}`);
    }
  }

  // Final report
  generateFinalReport();
  saveReport();
}

main().catch(console.error);
