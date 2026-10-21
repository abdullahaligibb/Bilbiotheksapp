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
      {user.role === 'admin' && <p><Link href="/admin">Administration</Link></p>}
      <LogoutButton />
      {paragraphs}
    </main>
  );
}
