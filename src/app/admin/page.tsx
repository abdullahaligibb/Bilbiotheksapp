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
      <ul className="menu-list">
        <li><Link href="/admin/books">Manage books and copies</Link><span>Add or edit books, inventory numbers and locations.</span></li>
        <li><Link href="/admin/users">Manage users</Link><span>Create accounts and edit names, emails and roles.</span></li>
        <li><Link href="/admin/loans">Loans and returns</Link><span>Check active and overdue loans and record returns.</span></li>
      </ul>
      <p><Link href="/">Home</Link></p>
      <LogoutButton />
    </main>
  );
}
