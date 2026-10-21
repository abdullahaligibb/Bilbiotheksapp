'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getPool } from '@/lib/db';
import { requireAdmin } from '@/lib/require-user';
import { validId, type FormState } from '@/lib/library-forms';

export async function returnLoan(loanId: number): Promise<FormState> {
  await requireAdmin();
  if (!validId(loanId)) return { error: 'Invalid loan ID.' };

  let bookId: number;
  try {
    // Update only an active loan. Keep the row and its original dates.
    const result = await getPool().query<{ book_id: number }>(
      `UPDATE loans
       SET returned_at = CURRENT_TIMESTAMP
       FROM copies
       WHERE loans.id = $1 AND loans.returned_at IS NULL
         AND copies.id = loans.copy_id
       RETURNING copies.book_id`,
      [loanId],
    );
    if (result.rows.length === 0) {
      return { error: 'This loan has already been returned or no longer exists.' };
    }
    bookId = result.rows[0].book_id;
  } catch {
    return { error: 'Returning failed. Please try again and check that the database is running.' };
  }

  revalidatePath('/admin/loans');
  revalidatePath('/loans');
  revalidatePath('/books');
  revalidatePath(`/books/${bookId}`);
  redirect('/admin/loans?returned=yes');
}
