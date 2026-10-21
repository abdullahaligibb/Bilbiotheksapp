'use client';

import { useActionState } from 'react';
import { returnLoan } from './actions';
import type { FormState } from '@/lib/library-forms';

export default function ReturnButton({ loanId }: { loanId: number }) {
  const action = returnLoan.bind(null, loanId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, { error: '' });

  return (
    <form action={formAction}>
      <button disabled={pending}>{pending ? 'Returning...' : 'Record return'}</button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}
