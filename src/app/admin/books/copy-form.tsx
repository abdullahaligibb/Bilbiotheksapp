'use client';

import { useActionState } from 'react';
import { saveCopy } from './actions';
import type { Copy, FormState } from '@/lib/library-forms';

export default function CopyForm({ bookId, copy }: { bookId: number; copy?: Copy }) {
  const action = saveCopy.bind(null, bookId, copy?.id ?? null);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, { error: '' });
  const prefix = copy ? `copy-${copy.id}` : 'new-copy';
  const values = state.values ?? { inventory_number: copy?.inventory_number ?? '', location: copy?.location ?? '' };

  return (
    <form action={formAction}>
      <p><label htmlFor={`${prefix}-number`}>Inventory number</label><br /><input id={`${prefix}-number`} name="inventory_number" required maxLength={100} defaultValue={values.inventory_number} /></p>
      <p><label htmlFor={`${prefix}-location`}>Location</label><br /><input id={`${prefix}-location`} name="location" required maxLength={200} defaultValue={values.location} /></p>
      {state.error && <p role="alert">{state.error}</p>}
      <button disabled={pending}>{pending ? 'Saving...' : copy ? 'Save copy' : 'Add copy'}</button>
    </form>
  );
}
