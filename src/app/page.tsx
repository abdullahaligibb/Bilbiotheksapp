import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { rows } = await getPool().query<{ id: number; message: string }>(
    'SELECT id, message FROM setup_check ORDER BY id',
  );

  return (
    <main>
      <h1>Bibliotheksapp</h1>
      {rows.map(({ id, message }) => <p key={id}>{message}</p>)}
    </main>
  );
}
