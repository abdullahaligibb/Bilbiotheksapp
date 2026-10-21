import Link from 'next/link';
import { requireAdmin } from '@/lib/require-user';
import UserForm from '../user-form';

export const dynamic = 'force-dynamic';

export default async function NewUserPage() {
  await requireAdmin();
  return <main><h1>Add user</h1><p><Link href="/admin/users">Back to users</Link></p><UserForm /></main>;
}
