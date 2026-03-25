/**
 * Migration runner
 * Run: node src/db/migrate.js
 * This reads schema.sql and executes it against your Neon PostgreSQL database.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false, sslmode: 'require' },
});

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('🔌 Connecting to Neon PostgreSQL...');
  const client = await pool.connect();

  try {
    console.log('📦 Running schema migration...');
    await client.query(sql);
    console.log('✅ Schema applied successfully!');
    console.log('');
    console.log('Tables created:');
    const res = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    res.rows.forEach(r => console.log(`  • ${r.tablename}`));
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
