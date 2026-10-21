import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import LoginForm from './login-form';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (session) {
    redirect('/');
  }

  return (
    <main className="login-page">
      <h1>Sign in</h1>
      <p>Sign in to search books and manage your loans.</p>
      <LoginForm />
    </main>
  );
}
