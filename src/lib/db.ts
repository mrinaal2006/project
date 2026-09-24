import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export const hasDb = !!connectionString;

let pool: Pool | null = null;

if (hasDb) {
  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });
}

export async function query(text: string, params?: any[]) {
  if (!pool) throw new Error('Database not configured');
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
}

export async function initPostgresDb() {
  if (!hasDb) return;
  
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255),
      password VARCHAR(255)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS files (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      path VARCHAR(1000) NOT NULL,
      type VARCHAR(50) NOT NULL,
      content TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, path)
    );
  `);
}
