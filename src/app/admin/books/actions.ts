'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getPool } from '@/lib/db';
import { requireAdmin } from '@/lib/require-user';
import { readText, validId, validIsbn, type FormState } from '@/lib/library-forms';

function databaseError(error: unknown, duplicateMessage: string) {
  if (error instanceof Error && 'code' in error && error.code === '23505') {
    return duplicateMessage;
  }
  return 'Saving failed. Please try again and check that the database is running.';
}

export async function saveBook(id: number | null, previousState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const isbnInput = readText(formData, 'isbn');
  const values = {
    title: readText(formData, 'title'),
    author: readText(formData, 'author'),
    isbn: isbnInput.replace(/[\s-]/g, '').toUpperCase(),
    publisher: readText(formData, 'publisher'),
    publication_year: readText(formData, 'publication_year'),
    category: readText(formData, 'category'),
    description: readText(formData, 'description'),
  };

  if (id !== null && !validId(id)) return { error: 'Invalid book ID.', values };
  if (!values.title || !values.author) return { error: 'Title and author are required.', values };
  if (isbnInput.length > 32) return { error: 'ISBN must have at most 32 characters, including spaces and hyphens.', values };
  if (values.title.length > 300 || values.author.length > 300 || values.publisher.length > 300 || values.category.length > 100 || values.description.length > 5000) {
    return { error: 'Please shorten the text to fit the field limits.', values };
  }
  if (values.isbn && !validIsbn(values.isbn)) return { error: 'Enter a valid ISBN-10 or ISBN-13, or leave ISBN empty.', values };
  const year = values.publication_year ? Number(values.publication_year) : null;
  if (year !== null && (!/^\d{1,4}$/.test(values.publication_year) || year < 1 || year > 9999)) {
    return { error: 'Publication year must be a whole number from 1 to 9999.', values };
  }

  let bookId = id;
  try {
    // The $ placeholders keep form values separate from the SQL commands.
    const parameters = [
      values.title,
      values.author,
      values.isbn || null,
      values.publisher || null,
      year,
      values.category || null,
      values.description || null,
    ];
    if (id === null) {
      const result = await getPool().query<{ id: number }>(
        `INSERT INTO books (title, author, isbn, publisher, publication_year, category, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        parameters,
      );
      bookId = result.rows[0].id;
    } else {
      const result = await getPool().query(
        `UPDATE books
         SET title=$1, author=$2, isbn=$3, publisher=$4,
             publication_year=$5, category=$6, description=$7
         WHERE id=$8`,
        [...parameters, id],
      );
      if (result.rowCount === 0) return { error: 'This book no longer exists.', values };
    }
  } catch (error) {
    return { error: databaseError(error, 'This ISBN already belongs to another book.'), values };
  }

  revalidatePath('/admin/books');
  revalidatePath(`/admin/books/${bookId}`);
  redirect(`/admin/books/${bookId}?saved=book`);
}

export async function saveCopy(bookId: number, copyId: number | null, previousState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const values = {
    inventory_number: readText(formData, 'inventory_number'),
    location: readText(formData, 'location'),
  };
  if (!validId(bookId) || (copyId !== null && !validId(copyId))) return { error: 'Invalid book or copy ID.', values };
  if (!values.inventory_number || !values.location) return { error: 'Inventory number and location are required.', values };
  if (values.inventory_number.length > 100 || values.location.length > 200) return { error: 'Inventory number: maximum 100 characters. Location: maximum 200 characters.', values };

  try {
    const book = await getPool().query('SELECT id FROM books WHERE id=$1', [bookId]);
    if (book.rowCount === 0) return { error: 'This book no longer exists.', values };
    if (copyId === null) {
      await getPool().query(
        'INSERT INTO copies (book_id, inventory_number, location) VALUES ($1, $2, $3)',
        [bookId, values.inventory_number, values.location],
      );
    } else {
      // Keep this copy linked to its book and its existing loans.
      const result = await getPool().query(
        'UPDATE copies SET inventory_number=$1, location=$2 WHERE id=$3 AND book_id=$4',
        [values.inventory_number, values.location, copyId, bookId],
      );
      if (result.rowCount === 0) return { error: 'This copy does not belong to this book or no longer exists.', values };
    }
  } catch (error) {
    return { error: databaseError(error, 'This inventory number is already in use.'), values };
  }

  revalidatePath('/admin/books');
  revalidatePath(`/admin/books/${bookId}`);
  redirect(`/admin/books/${bookId}?saved=copy`);
}
