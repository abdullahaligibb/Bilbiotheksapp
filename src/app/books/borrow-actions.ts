'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getPool } from '@/lib/db';
import { requireUser } from '@/lib/require-user';
import { validId, type FormState } from '@/lib/library-forms';

export async function borrowCopy(copyId: number): Promise<FormState> {
  const user = await requireUser();
  if (!validId(copyId)) return { error: 'Invalid copy ID.' };

  let bookId: number;
  try {
    const connection = await getPool().connect();
    try {
      await connection.query('BEGIN');

      // Lock this copy until we finish. A second request must wait.
      const copy = await connection.query<{ book_id: number }>(
        'SELECT book_id FROM copies WHERE id=$1 FOR UPDATE',
        [copyId],
      );
      if (copy.rows.length === 0) {
        await connection.query('ROLLBACK');
        return { error: 'This copy no longer exists.' };
      }
      bookId = copy.rows[0].book_id;

      // Check again on the server, even if the page showed Available.
      const activeLoan = await connection.query(
        'SELECT id FROM loans WHERE copy_id=$1 AND returned_at IS NULL',
        [copyId],
      );
      if (activeLoan.rows.length > 0) {
        await connection.query('ROLLBACK');
        return { error: 'This copy is already on loan. Please choose another copy.' };
      }

      // The user comes from the session. PostgreSQL sets both dates.
      await connection.query(
        `INSERT INTO loans (user_id, copy_id, borrowed_at, due_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days')`,
        [user.id, copyId],
      );
      await connection.query('COMMIT');
    } catch (error) {
      await connection.query('ROLLBACK');
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    // The database also has a rule against two active loans for one copy.
    if (error instanceof Error && 'code' in error && error.code === '23505') {
      return { error: 'This copy is already on loan. Please choose another copy.' };
    }
    return { error: 'Borrowing failed. Please try again and check that the database is running.' };
  }

  revalidatePath('/books');
  revalidatePath(`/books/${bookId}`);
  revalidatePath('/loans');
  redirect('/loans?borrowed=yes');
}
