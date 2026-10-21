import nextEnv from '@next/env';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

// Load the settings from the environment files.
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

  // Add the library tables and links. Keep existing data.
  const libraryFile = new URL('../database/migrations/001_library_schema.sql', import.meta.url);
  const librarySql = await readFile(libraryFile, 'utf8');
  await pool.query(librarySql);
} finally {
  // Close the connections, even if a query fails.
  await pool.end();
}
