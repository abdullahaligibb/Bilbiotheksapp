import nextEnv from '@next/env';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
nextEnv.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL in .env.local');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  const sql = await readFile(new URL('../database/setup.sql', import.meta.url), 'utf8');
  await pool.query(sql);
  const { rows } = await pool.query('SELECT id, message FROM setup_check ORDER BY id');
  console.table(rows);
} finally {
  await pool.end();
}
