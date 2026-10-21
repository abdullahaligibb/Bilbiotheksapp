import Link from 'next/link';
import { requireAdmin } from '@/lib/require-user';
import LogoutButton from '../logout-button';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await requireAdmin();

  return (
    <main>
      <h1>Administration</h1>
      <p>Signed in as {user.name}.</p>
      <p>Role: {user.role}</p>
      <p><Link href="/">Home</Link></p>
      <LogoutButton />
    </main>
  );
}
