import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <main>
      <h1>Access denied</h1>
      <p>You do not have permission to open this page.</p>
      <Link href="/">Home</Link>
    </main>
  );
}
