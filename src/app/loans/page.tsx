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
  returned_at: Date | null;
  overdue: boolean;
};

type PageProps = { searchParams: Promise<{ borrowed?: string; view?: string | string[] }> };

function formatDate(date: Date) {
  return date.toLocaleString('de-CH', { timeZone: 'Europe/Zurich' });
}

export default async function MyLoansPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const { borrowed, view } = await searchParams;
  // Accept only these views. Other values show the active loans.
  let selectedView = 'active';
  let caption = 'Your active loans';
  let emptyMessage = 'You have no active loans.';
  if (view === 'overdue') {
    selectedView = 'overdue';
    caption = 'Your overdue loans';
    emptyMessage = 'You have no overdue loans.';
  } else if (view === 'history') {
    selectedView = 'history';
    caption = 'Your loan history';
    emptyMessage = 'You have no returned loans yet.';
  }
  const result = await getPool().query<MyLoan>(
    `SELECT loans.id, books.id AS book_id, books.title, copies.inventory_number,
            loans.borrowed_at, loans.due_at, loans.returned_at,
            (loans.returned_at IS NULL AND loans.due_at < CURRENT_TIMESTAMP) AS overdue
     FROM loans
     JOIN copies ON copies.id = loans.copy_id
     JOIN books ON books.id = copies.book_id
     WHERE loans.user_id = $1
       AND (($2 = 'active' AND loans.returned_at IS NULL)
         OR ($2 = 'overdue' AND loans.returned_at IS NULL AND loans.due_at < CURRENT_TIMESTAMP)
         OR ($2 = 'history' AND loans.returned_at IS NOT NULL))
     ORDER BY loans.due_at, loans.id`,
    [user.id, selectedView],
  );

  return (
    <main>
      <h1>My loans</h1>
      <p><Link href="/">Home</Link> · <Link href="/books">Search books</Link></p>
      {borrowed === 'yes' && <p role="status">Copy borrowed successfully.</p>}
      <nav aria-label="Loan views">
        <Link href="/loans" aria-current={selectedView === 'active' ? 'page' : undefined}>Active loans</Link> ·{' '}
        <Link href="/loans?view=overdue" aria-current={selectedView === 'overdue' ? 'page' : undefined}>Overdue loans</Link> ·{' '}
        <Link href="/loans?view=history" aria-current={selectedView === 'history' ? 'page' : undefined}>Loan history</Link>
      </nav>
      <p>The loan period is 30 days. An active loan is overdue when its deadline has passed.</p>
      {result.rows.length === 0 ? <p>{emptyMessage}</p> : (
        <div className="table-scroll" role="region" aria-label="My loans" tabIndex={0}>
          <table>
            <caption>{caption}</caption>
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Inventory number</th>
                <th scope="col">Borrowed on</th>
                <th scope="col">Due by</th>
                <th scope="col">Returned on</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>{result.rows.map(function (loan) {
              let status = 'On loan';
              if (loan.returned_at) {
                status = 'Returned';
              } else if (loan.overdue) {
                status = 'Overdue';
              }
              return (
                <tr key={loan.id}>
                  <td><Link href={`/books/${loan.book_id}`}>{loan.title}</Link></td>
                  <td>{loan.inventory_number}</td>
                  <td><time dateTime={loan.borrowed_at.toISOString()}>{formatDate(loan.borrowed_at)}</time></td>
                  <td><time dateTime={loan.due_at.toISOString()}>{formatDate(loan.due_at)}</time></td>
                  <td>{loan.returned_at ? <time dateTime={loan.returned_at.toISOString()}>{formatDate(loan.returned_at)}</time> : '—'}</td>
                  <td>{loan.overdue ? <strong>{status}</strong> : status}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
    </main>
  );
}
