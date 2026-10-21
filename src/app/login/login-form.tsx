'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email')).trim().toLowerCase();
    const password = String(formData.get('password'));

    setError('');
    setIsLoading(true);

    try {
      const result = await authClient.signIn.email({ email, password });

      if (result.error) {
        setError('Could not sign in. Check your details or try again shortly.');
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  let buttonText = 'Sign in';
  if (isLoading) {
    buttonText = 'Signing in...';
  }

  return (
    <form onSubmit={signIn}>
      <p>
        <label htmlFor="email">Email</label><br />
        <input id="email" name="email" type="email" autoComplete="username" required />
      </p>
      <p>
        <label htmlFor="password">Password</label><br />
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </p>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={isLoading}>{buttonText}</button>
    </form>
  );
}
