'use client';

import { useActionState } from 'react';
import { borrowCopy } from './borrow-actions';
import type { FormState } from '@/lib/library-forms';

export default function BorrowButton({ copyId }: { copyId: number }) {
  const action = borrowCopy.bind(null, copyId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, { error: '' });

  return (
    <form action={formAction}>
      <button disabled={pending}>{pending ? 'Borrowing...' : 'Borrow for 30 days'}</button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}
