'use server';

import { hashPassword } from 'better-auth/crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getPool } from '@/lib/db';
import { requireAdmin } from '@/lib/require-user';
import { readText, validId, type FormState } from '@/lib/library-forms';
import { validEmail, type ManagedUser } from '@/lib/user-forms';

export async function saveUser(id: number | null, previousState: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const values = {
    name: readText(formData, 'name'),
    email: readText(formData, 'email').toLowerCase(),
    role: readText(formData, 'role'),
  };

  if (id !== null && !validId(id)) return { error: 'Invalid user ID.', values };
  if (!values.name || values.name.length > 100) return { error: 'Enter a name with 1 to 100 characters.', values };
  if (!validEmail(values.email)) {
    return { error: 'Enter a valid email address with at most 254 characters.', values };
  }
  if (values.role !== 'user' && values.role !== 'admin') return { error: 'Choose user or admin as the role.', values };
  if (id === Number(admin.id) && values.role !== 'admin') {
    return { error: 'You cannot remove your own admin role. Ask another admin to change it.', values };
  }

  // Never return the password to the page or change a password when editing.
  const passwordField = formData.get('password');
  const password = typeof passwordField === 'string' ? passwordField : '';
  if (id === null && (password.length < 12 || password.length > 128)) {
    return { error: 'The initial password must have 12 to 128 characters.', values };
  }

  let userId = id;
  let signInAgain = false;
  try {
    // Use the same password function as our existing demo-account script.
    const passwordHash = id === null ? await hashPassword(password) : null;
    const connection = await getPool().connect();
    try {
      await connection.query('BEGIN');
      // Save one user at a time, so two admins cannot remove each other's role at once.
      await connection.query('LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE');
      const actor = await connection.query('SELECT role FROM users WHERE id=$1', [admin.id]);
      if (actor.rows[0]?.role !== 'admin') {
        await connection.query('ROLLBACK');
        return { error: 'Your admin role has changed. Please sign in again.', values };
      }

      if (id === null) {
        const result = await connection.query<{ id: number }>(
          'INSERT INTO users (name, email, role) VALUES ($1, $2, $3) RETURNING id',
          [values.name, values.email, values.role],
        );
        userId = result.rows[0].id;
        await connection.query(
          `INSERT INTO auth_accounts (user_id, account_id, provider_id, password_hash)
           VALUES ($1, $2, 'credential', $3)`,
          [userId, String(userId), passwordHash],
        );
      } else {
        const result = await connection.query<ManagedUser>('SELECT id, name, email, role FROM users WHERE id=$1', [id]);
        const existing = result.rows[0];
        if (!existing) {
          await connection.query('ROLLBACK');
          return { error: 'This user no longer exists.', values };
        }
        await connection.query(
          `UPDATE users SET name=$1, email=$2, role=$3,
           email_verified=CASE WHEN email=$2 THEN email_verified ELSE false END,
           updated_at=CURRENT_TIMESTAMP WHERE id=$4`,
          [values.name, values.email, values.role, id],
        );

        // An email or role change ends the affected user's current sessions.
        if (existing.email !== values.email || existing.role !== values.role) {
          await connection.query('DELETE FROM auth_sessions WHERE user_id=$1', [id]);
          signInAgain = id === Number(admin.id);
        }
      }
      await connection.query('COMMIT');
    } catch (error) {
      await connection.query('ROLLBACK');
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === '23505') {
      return { error: 'This email address is already in use.', values };
    }
    return { error: 'Saving failed. Please try again and check that the database is running.', values };
  }

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
  if (signInAgain) redirect('/login');
  redirect(`/admin/users/${userId}?saved=yes`);
}
