import Link from 'next/link';
import { requireAdmin } from '@/lib/require-user';
import BookForm from '../book-form';

export const dynamic = 'force-dynamic';

export default async function NewBookPage() {
  await requireAdmin();
  return <main><h1>Add book</h1><p><Link href="/admin/books">Back to books</Link></p><BookForm /></main>;
}
