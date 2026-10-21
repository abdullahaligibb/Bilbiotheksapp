'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export default function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function signOut() {
    setError('');
    setIsLoading(true);

    try {
      const result = await authClient.signOut();

      if (result.error) {
        setError('Could not sign out. Please try again.');
        return;
      }

      router.replace('/login');
      router.refresh();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={signOut} disabled={isLoading}>Sign out</button>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
