import nextEnv from '@next/env';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

// Load the same environment files that Next.js uses.
nextEnv.loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL in .env.local');
}

const pool = new pg.Pool({ connectionString: databaseUrl });

try {
  // Read and run the SQL file.
  const setupFile = new URL('../database/setup.sql', import.meta.url);
  const sql = await readFile(setupFile, 'utf8');
  await pool.query(sql);
} finally {
  // Close the connections even if a query fails.
  await pool.end();
}
