import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from './auth';

export async function requireUser() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    redirect('/login');
  }

  return session.user;
}

// Use this check on every future admin page and admin action.
export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== 'admin') {
    redirect('/forbidden');
  }

  return user;
}
