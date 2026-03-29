import { Pool, type QueryResultRow } from 'pg';

// Initialize a connection pool for our NeonDB instance.
// In Next.js serverless functions, we want to prevent creating a new pool on every warm boot.
const globalForPg = global as unknown as { pool: Pool | undefined };

function normalizeDatabaseUrl(url?: string) {
  if (!url) return url;

  // Keep current behavior and silence pg-connection-string warning for upcoming semantics changes.
  return url.replace(/([?&])sslmode=require(&|$)/, '$1sslmode=verify-full$2');
}

export const pool = globalForPg.pool || new Pool({
  connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL),
});

if (process.env.NODE_ENV !== 'production') globalForPg.pool = pool;

export async function query<T extends QueryResultRow>(text: string, params?: unknown[]) {
  return pool.query<T>(text, params);
}
