import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'liberamundo',
  user: process.env.DB_USER || 'liberamundo',
  password: process.env.DB_PASSWORD || 'liberamundo',
  // Reconnection settings
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Log connection errors (don't crash)
pool.on('error', (err) => {
  console.error('⚠️ Unexpected DB pool error:', err.message);
});

export default pool;
