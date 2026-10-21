import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPool } from '@/lib/db';
import { requireUser } from '@/lib/require-user';
import { validId, type Book } from '@/lib/library-forms';
import BorrowButton from '../borrow-button';

export const dynamic = 'force-dynamic';

type BookCopy = {
  id: number;
  inventory_number: string;
  location: string;
  available: boolean;
};

type PageProps = { params: Promise<{ id: string }> };

export default async function BookDetailsPage({ params }: PageProps) {
  const user = await requireUser();
  const { id } = await params;
  const bookId = Number(id);
  if (!/^\d+$/.test(id) || !validId(bookId)) notFound();

  const result = await getPool().query<Book>(
    'SELECT id, title, author, isbn, publisher, publication_year, category, description FROM books WHERE id=$1',
    [bookId],
  );
  const book = result.rows[0];
  if (!book) notFound();

  // Only loans without a return date make a copy unavailable.
  const copies = await getPool().query<BookCopy>(
    `SELECT copies.id, copies.inventory_number, copies.location,
            loans.id IS NULL AS available
     FROM copies
     LEFT JOIN loans ON loans.copy_id = copies.id AND loans.returned_at IS NULL
     WHERE copies.book_id = $1
     ORDER BY copies.inventory_number, copies.id`,
    [bookId],
  );
  const availableCopies = copies.rows.filter(function (copy) {
    return copy.available;
  });

  return (
    <main>
      <h1>{book.title}</h1>
      <p><Link href="/books">Back to book search</Link></p>
      <p><Link href="/loans">My loans</Link></p>
      <p>Author: {book.author}</p>
      <p>ISBN: {book.isbn ?? '—'}</p>
      {book.publisher && <p>Publisher: {book.publisher}</p>}
      {book.publication_year !== null && <p>Publication year: {book.publication_year}</p>}
      {book.category && <p>Category: {book.category}</p>}
      {book.description && <p>{book.description}</p>}
      {user.role === 'admin' && <p><Link href={`/admin/books/${book.id}`}>Edit book</Link></p>}
      <h2>Copies</h2>
      <p>Available copies: {availableCopies.length} of {copies.rows.length}</p>
      <p>You can borrow an available copy for yourself for 30 days.</p>
      {copies.rows.length === 0 ? <p>No copies have been added for this book.</p> : (
        <>
          {availableCopies.length === 0 && <p>No copies are currently available.</p>}
          <div className="table-scroll" role="region" aria-label="Book copies" tabIndex={0}>
            <table>
              <caption>Copies and locations</caption>
              <thead>
                <tr>
                  <th scope="col">Inventory number</th>
                  <th scope="col">Location</th>
                  <th scope="col">Status</th>
                  <th scope="col">Borrow</th>
                </tr>
              </thead>
              <tbody>{copies.rows.map(function (copy) {
                return (
                  <tr key={copy.id}>
                    <td>{copy.inventory_number}</td>
                    <td>{copy.location}</td>
                    <td>{copy.available ? 'Available' : 'On loan'}</td>
                    <td>{copy.available ? <BorrowButton copyId={copy.id} /> : '—'}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
