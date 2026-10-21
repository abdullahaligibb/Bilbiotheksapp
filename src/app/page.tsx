import { getPool } from '@/lib/db';
import Link from 'next/link';
import { requireUser } from '@/lib/require-user';
import LogoutButton from './logout-button';

export const dynamic = 'force-dynamic';

type SetupMessage = {
  id: number;
  message: string;
};

export default async function Home() {
  const user = await requireUser();

  // 1. Get the database connection.
  const database = getPool();

  // 2. Ask PostgreSQL for the saved messages.
  const sql = 'SELECT id, message FROM setup_check ORDER BY id';
  const result = await database.query<SetupMessage>(sql);
  const messages = result.rows;

  // 3. Make one paragraph for each message.
  const paragraphs = messages.map(function (savedMessage) {
    return <p key={savedMessage.id}>{savedMessage.message}</p>;
  });

  return (
    <main>
      <h1>Bibliotheksapp</h1>
      <p>Signed in as {user.name}.</p>
      <p>Role: {user.role}</p>
      <ul className="menu-list">
        <li><Link href="/books">Search books</Link><span>Find a book and check its available copies.</span></li>
        <li><Link href="/loans">My loans</Link><span>See your loans, deadlines and returned copies.</span></li>
        {user.role === 'admin' && <li><Link href="/admin">Administration</Link><span>Manage books, users and returns.</span></li>}
      </ul>
      <LogoutButton />
      <div className="connection-note">{paragraphs}</div>
    </main>
  );
}
