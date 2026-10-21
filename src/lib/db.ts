import 'server-only';
import { Pool } from 'pg';

type DatabaseCache = {
  pgPool?: Pool;
};

// Remember the connection pool when Next.js reloads a saved file.
const globalForPg = globalThis as unknown as DatabaseCache;

export function getPool() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('Missing DATABASE_URL in .env.local');
  }

  // Reuse the existing pool if we already made one.
  if (globalForPg.pgPool) {
    return globalForPg.pgPool;
  }

  // Otherwise, make a new pool with the same connection settings.
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  });

  // Handle idle connections closing, for example when Docker stops.
  pool.on('error', function () {
    console.error('An idle database connection closed. Check Docker.');
  });

  globalForPg.pgPool = pool;
  return pool;
}

// Both projects support the CRUD page's `import pool from "../lib/db"`.
const pool = getPool();
export default pool;
