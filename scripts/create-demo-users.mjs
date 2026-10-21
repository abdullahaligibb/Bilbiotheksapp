import nextEnv from '@next/env';
import pg from 'pg';
import { hashPassword } from 'better-auth/crypto';

nextEnv.loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL in .env.local');
}

const demoUsers = [
  {
    name: 'Demo User',
    email: 'user@example.test',
    role: 'user',
    password: process.env.DEMO_USER_PASSWORD,
  },
  {
    name: 'Demo Admin',
    email: 'admin@example.test',
    role: 'admin',
    password: process.env.DEMO_ADMIN_PASSWORD,
  },
];

for (const user of demoUsers) {
  if (!user.password || user.password.length < 12 || user.password.length > 128 || user.password.startsWith('REPLACE_')) {
    throw new Error('Replace both demo password placeholders in .env.local, using 12 to 128 characters.');
  }
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  const connection = await pool.connect();

  try {
    await connection.query('BEGIN');

    for (const user of demoUsers) {
      // Do not change an existing user's password or role.
      const existing = await connection.query(
        'SELECT id FROM users WHERE lower(email) = $1',
        [user.email],
      );
      if (existing.rows.length > 0) {
        continue;
      }

      // Better Auth creates the hash. We do not save the plain password.
      const passwordHash = await hashPassword(user.password);
      const result = await connection.query(
        'INSERT INTO users (name, email, role) VALUES ($1, $2, $3) RETURNING id',
        [user.name, user.email, user.role],
      );
      const userId = result.rows[0].id;

      await connection.query(
        `INSERT INTO auth_accounts (user_id, account_id, provider_id, password_hash)
         VALUES ($1, $2, 'credential', $3)`,
        [userId, String(userId), passwordHash],
      );
    }

    await connection.query('COMMIT');
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
} finally {
  await pool.end();
}
