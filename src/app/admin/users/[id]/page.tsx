import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPool } from '@/lib/db';
import { requireAdmin } from '@/lib/require-user';
import { validId } from '@/lib/library-forms';
import type { ManagedUser } from '@/lib/user-forms';
import UserForm from '../user-form';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> };

export default async function EditUserPage({ params, searchParams }: PageProps) {
  const admin = await requireAdmin();
  const { id } = await params;
  const userId = Number(id);
  if (!/^\d+$/.test(id) || !validId(userId)) notFound();
  const result = await getPool().query<ManagedUser>('SELECT id, name, email, role FROM users WHERE id=$1', [userId]);
  const user = result.rows[0];
  if (!user) notFound();
  const { saved } = await searchParams;

  return (
    <main>
      <h1>Edit user: {user.name}</h1>
      <p><Link href="/admin/users">Back to users</Link></p>
      {saved === 'yes' && <p role="status">User saved.</p>}
      <UserForm key={JSON.stringify(user)} user={user} currentUserId={Number(admin.id)} />
    </main>
  );
}
