const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon / Supabase
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

/**
 * Run a query with optional params
 * @param {string} text - SQL query
 * @param {Array} params - query parameters
 */
async function query(text, params = []) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DB] ${text.slice(0, 60)}... | ${duration}ms | rows: ${res.rowCount}`);
  }
  return res;
}

/**
 * Get a client from pool (for transactions)
 */
async function getClient() {
  return pool.connect();
}

module.exports = { query, getClient, pool };
