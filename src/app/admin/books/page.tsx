import Link from 'next/link';
import { getPool } from '@/lib/db';
import { requireAdmin } from '@/lib/require-user';

export const dynamic = 'force-dynamic';

type BookRow = { id: number; title: string; author: string; isbn: string | null; copy_count: number };

export default async function BooksPage() {
  await requireAdmin();
  const result = await getPool().query<BookRow>(
    `SELECT books.id, books.title, books.author, books.isbn,
            COUNT(copies.id)::integer AS copy_count
     FROM books
     LEFT JOIN copies ON copies.book_id=books.id
     GROUP BY books.id
     ORDER BY books.title, books.id`,
  );

  return (
    <main>
      <h1>Books and copies</h1>
      <p><Link href="/admin">Administration</Link></p>
      <p><Link href="/admin/books/new">Add book</Link></p>
      {result.rows.length === 0 ? <p>No books yet.</p> : (
        <div className="table-scroll" role="region" aria-label="Books and copies" tabIndex={0}>
          <table>
            <caption>Saved books</caption>
            <thead><tr><th scope="col">Title</th><th scope="col">Author</th><th scope="col">ISBN</th><th scope="col">Copies</th><th scope="col">Edit</th></tr></thead>
            <tbody>{result.rows.map(function (book) {
              return <tr key={book.id}><td>{book.title}</td><td>{book.author}</td><td>{book.isbn ?? '—'}</td><td>{book.copy_count}</td><td><Link href={`/admin/books/${book.id}`}>Edit {book.title}</Link></td></tr>;
            })}</tbody>
          </table>
        </div>
      )}
    </main>
  );
}
