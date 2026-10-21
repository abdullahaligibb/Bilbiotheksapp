import Link from 'next/link';
import { getPool } from '@/lib/db';
import { requireUser } from '@/lib/require-user';

export const dynamic = 'force-dynamic';

type MyLoan = {
  id: number;
  book_id: number;
  title: string;
  inventory_number: string;
  borrowed_at: Date;
  due_at: Date;
};

type PageProps = { searchParams: Promise<{ borrowed?: string }> };

function formatDate(date: Date) {
  return date.toLocaleString('de-CH', { timeZone: 'Europe/Zurich' });
}

export default async function MyLoansPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const { borrowed } = await searchParams;
  const result = await getPool().query<MyLoan>(
    `SELECT loans.id, books.id AS book_id, books.title, copies.inventory_number,
            loans.borrowed_at, loans.due_at
     FROM loans
     JOIN copies ON copies.id = loans.copy_id
     JOIN books ON books.id = copies.book_id
     WHERE loans.user_id = $1 AND loans.returned_at IS NULL
     ORDER BY loans.due_at, loans.id`,
    [user.id],
  );

  return (
    <main>
      <h1>My loans</h1>
      <p><Link href="/">Home</Link> · <Link href="/books">Search books</Link></p>
      {borrowed === 'yes' && <p role="status">Copy borrowed successfully.</p>}
      <p>These are your active loans. The loan period is 30 days.</p>
      {result.rows.length === 0 ? <p>You have no active loans.</p> : (
        <table>
          <caption>Your active loans</caption>
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Inventory number</th>
              <th scope="col">Borrowed on</th>
              <th scope="col">Due by</th>
            </tr>
          </thead>
          <tbody>{result.rows.map(function (loan) {
            return (
              <tr key={loan.id}>
                <td><Link href={`/books/${loan.book_id}`}>{loan.title}</Link></td>
                <td>{loan.inventory_number}</td>
                <td><time dateTime={loan.borrowed_at.toISOString()}>{formatDate(loan.borrowed_at)}</time></td>
                <td><time dateTime={loan.due_at.toISOString()}>{formatDate(loan.due_at)}</time></td>
              </tr>
            );
          })}</tbody>
        </table>
      )}
    </main>
  );
}
