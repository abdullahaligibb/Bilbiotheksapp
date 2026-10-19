import 'server-only';
import { Pool } from 'pg';

// Keep one connection pool during development hot reloads.
const globalForPg = globalThis as unknown as { pgPool?: Pool };
export function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL in .env.local');
  if (globalForPg.pgPool) return globalForPg.pgPool;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  });
  // A stopped Docker container can close idle connections. pg removes them;
  // handle the notification so it cannot become an uncaught EventEmitter error.
  pool.on('error', () => console.error('An idle database connection closed. Check Docker.'));
  globalForPg.pgPool = pool;
  return pool;
}
