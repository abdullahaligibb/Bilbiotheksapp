import 'server-only';
import { Pool } from 'pg';

type DatabaseCache = {
  pgPool?: Pool;
};

// Keep the pool when Next.js reloads a saved file.
const globalForPg = globalThis as unknown as DatabaseCache;

export function getPool() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('Missing DATABASE_URL in .env.local');
  }

  // Use the pool we already have.
  if (globalForPg.pgPool) {
    return globalForPg.pgPool;
  }

  // If there is no pool yet, create one.
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  });

  // Handle a closed connection, for example when Docker stops.
  pool.on('error', function () {
    console.error('An idle database connection closed. Check Docker.');
  });

  globalForPg.pgPool = pool;
  return pool;
}

// A page can also use: import pool from "../lib/db".
const pool = getPool();
export default pool;
