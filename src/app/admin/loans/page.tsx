import Link from 'next/link';
import { getPool } from '@/lib/db';
import { requireAdmin } from '@/lib/require-user';
import ReturnButton from './return-button';

export const dynamic = 'force-dynamic';

type ActiveLoan = {
  id: number;
  book_id: number;
  title: string;
  inventory_number: string;
  name: string;
  email: string;
  borrowed_at: Date;
  due_at: Date;
};

type PageProps = { searchParams: Promise<{ returned?: string }> };

function formatDate(date: Date) {
  return date.toLocaleString('de-CH', { timeZone: 'Europe/Zurich' });
}

export default async function ManageLoansPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { returned } = await searchParams;
  const result = await getPool().query<ActiveLoan>(
    `SELECT loans.id, books.id AS book_id, books.title, copies.inventory_number,
            users.name, users.email, loans.borrowed_at, loans.due_at
     FROM loans
     JOIN copies ON copies.id = loans.copy_id
     JOIN books ON books.id = copies.book_id
     JOIN users ON users.id = loans.user_id
     WHERE loans.returned_at IS NULL
     ORDER BY loans.due_at, loans.id`,
  );

  return (
    <main>
      <h1>Loans and returns</h1>
      <p><Link href="/admin">Administration</Link></p>
      {returned === 'yes' && <p role="status">Return recorded.</p>}
      <p>Record a return after receiving the physical copy.</p>
      {result.rows.length === 0 ? <p>No active loans.</p> : (
        <table>
          <caption>Active loans</caption>
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Inventory number</th>
              <th scope="col">Borrower</th>
              <th scope="col">Email</th>
              <th scope="col">Borrowed on</th>
              <th scope="col">Due by</th>
              <th scope="col">Return</th>
            </tr>
          </thead>
          <tbody>{result.rows.map(function (loan) {
            return (
              <tr key={loan.id}>
                <td><Link href={`/books/${loan.book_id}`}>{loan.title}</Link></td>
                <td>{loan.inventory_number}</td>
                <td>{loan.name}</td>
                <td>{loan.email}</td>
                <td><time dateTime={loan.borrowed_at.toISOString()}>{formatDate(loan.borrowed_at)}</time></td>
                <td><time dateTime={loan.due_at.toISOString()}>{formatDate(loan.due_at)}</time></td>
                <td><ReturnButton loanId={loan.id} /></td>
              </tr>
            );
          })}</tbody>
        </table>
      )}
    </main>
  );
}
