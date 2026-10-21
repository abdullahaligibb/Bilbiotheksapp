import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPool } from '@/lib/db';
import { requireAdmin } from '@/lib/require-user';
import { validId, type Book, type Copy } from '@/lib/library-forms';
import BookForm from '../book-form';
import CopyForm from '../copy-form';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> };

export default async function EditBookPage({ params, searchParams }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const bookId = Number(id);
  if (!/^\d+$/.test(id) || !validId(bookId)) notFound();
  const result = await getPool().query<Book>('SELECT id, title, author, isbn, publisher, publication_year, category, description FROM books WHERE id=$1', [bookId]);
  const book = result.rows[0];
  if (!book) notFound();
  const copies = await getPool().query<Copy>('SELECT id, book_id, inventory_number, location FROM copies WHERE book_id=$1 ORDER BY inventory_number, id', [bookId]);
  const { saved } = await searchParams;

  return (
    <main>
      <h1>Edit book: {book.title}</h1>
      <p><Link href="/admin/books">Back to books</Link></p>
      {saved === 'book' && <p role="status">Book saved.</p>}
      {saved === 'copy' && <p role="status">Copy saved.</p>}
      <BookForm key={`book-${book.id}-${JSON.stringify(book)}`} book={book} />
      <h2>Copies of this book</h2>
      {copies.rows.length === 0 && <p>No copies yet.</p>}
      {copies.rows.map(function (copy) {
        return <section key={`${copy.id}-${copy.inventory_number}-${copy.location}`}><h3>Copy: {copy.inventory_number}</h3><CopyForm bookId={book.id} copy={copy} /></section>;
      })}
      <h2>Add copy</h2>
      <CopyForm key={`new-${copies.rows.length}`} bookId={book.id} />
    </main>
  );
}
