import { Pool, type QueryResultRow } from 'pg';

// Initialize a connection pool for our NeonDB instance.
// In Next.js serverless functions, we want to prevent creating a new pool on every warm boot.
const globalForPg = global as unknown as { pool: Pool | undefined };

export const pool = globalForPg.pool || new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon.tech DBs
  }
});

if (process.env.NODE_ENV !== 'production') globalForPg.pool = pool;

export async function query<T extends QueryResultRow>(text: string, params?: unknown[]) {
  return pool.query<T>(text, params);
}
