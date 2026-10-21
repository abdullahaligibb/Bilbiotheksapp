import Link from 'next/link';
import { getPool } from '@/lib/db';
import { requireUser } from '@/lib/require-user';

export const dynamic = 'force-dynamic';

type SearchBook = {
  id: number;
  title: string;
  author: string;
  isbn: string | null;
  total_copies: number;
  available_copies: number;
};
type PageProps = { searchParams: Promise<{ q?: string | string[] }> };

export default async function BookSearchPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const { q } = await searchParams;
  const search = typeof q === 'string' ? q.trim() : '';
  let error = '';
  if (Array.isArray(q)) error = 'Please use one search term.';
  if (search.length > 300) error = 'The search term must have at most 300 characters.';

  let books: SearchBook[] = [];
  let moreResults = false;
  if (!error) {
    // Our book form saves ISBNs without spaces or hyphens.
    const isbnSearch = search.replace(/[\s-]/g, '');
    const result = await getPool().query<SearchBook>(
      `SELECT books.id, books.title, books.author, books.isbn,
              COUNT(copies.id)::integer AS total_copies,
              (COUNT(copies.id) FILTER (WHERE loans.id IS NULL))::integer AS available_copies
       FROM books
       LEFT JOIN copies ON copies.book_id = books.id
       LEFT JOIN loans ON loans.copy_id = copies.id AND loans.returned_at IS NULL
       WHERE $1 = ''
          OR POSITION(LOWER($1) IN LOWER(title)) > 0
          OR POSITION(LOWER($1) IN LOWER(author)) > 0
          OR ($2 <> '' AND POSITION(LOWER($2) IN LOWER(COALESCE(isbn, ''))) > 0)
       GROUP BY books.id
       ORDER BY books.title, books.id
       LIMIT 101`,
      [search, isbnSearch],
    );
    // Read one extra book to see whether there are more than 100 matches.
    moreResults = result.rows.length > 100;
    books = result.rows.slice(0, 100);
  }

  return (
    <main>
      <h1>Book search</h1>
      <p><Link href="/">Home</Link></p>
      <form action="/books" method="get">
        <p>
          <label htmlFor="search">Title, author or ISBN</label><br />
          <input id="search" name="q" type="search" maxLength={300} defaultValue={search} />
        </p>
        <button>Search</button>
      </form>
      <p>Enter part of a title, author or ISBN. Leave the search empty to browse books.</p>
      <p>Open a book to see its copies and locations. A copy is available when it has no active loan.</p>
      <p><Link href="/books">Clear search</Link></p>
      {error ? <p role="alert">{error}</p> : (
        <>
          {moreResults && <p>Showing the first 100 matches. Please narrow your search.</p>}
          {books.length === 0 ? <p>No books found.</p> : (
            <div className="table-scroll" role="region" aria-label="Book results" tabIndex={0}>
              <table>
                <caption>{search ? `Books matching: ${search}` : 'Books'}</caption>
                <thead>
                  <tr>
                    <th scope="col">Title</th>
                    <th scope="col">Author</th>
                    <th scope="col">ISBN</th>
                    <th scope="col">Available copies</th>
                    {user.role === 'admin' && <th scope="col">Edit</th>}
                  </tr>
                </thead>
                <tbody>{books.map(function (book) {
                  return (
                    <tr key={book.id}>
                      <td><Link href={`/books/${book.id}`}>{book.title}</Link></td>
                      <td>{book.author}</td>
                      <td>{book.isbn ?? '—'}</td>
                      <td>{book.available_copies} of {book.total_copies}</td>
                      {user.role === 'admin' && <td><Link href={`/admin/books/${book.id}`}>Edit {book.title}</Link></td>}
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}
