'use client';

import { useActionState } from 'react';
import { saveUser } from './actions';
import type { FormState } from '@/lib/library-forms';
import type { ManagedUser } from '@/lib/user-forms';

type UserFormProps = { user?: ManagedUser; currentUserId?: number };

export default function UserForm({ user, currentUserId }: UserFormProps) {
  const action = saveUser.bind(null, user?.id ?? null);
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, { error: '' });
  const values = state.values ?? { name: user?.name ?? '', email: user?.email ?? '', role: user?.role ?? 'user' };
  const ownAccount = user !== undefined && user.id === currentUserId;

  return (
    <form action={formAction}>
      <p>
        <label htmlFor="name">Name</label><br />
        <input id="name" name="name" required maxLength={100} defaultValue={values.name} />
      </p>
      <p>
        <label htmlFor="email">Email</label><br />
        <input id="email" name="email" type="email" required maxLength={254} autoComplete="off" defaultValue={values.email} />
      </p>
      {ownAccount ? (
        <p>Role: admin. You cannot remove your own admin role.<input type="hidden" name="role" value="admin" /></p>
      ) : (
        <p>
          <label htmlFor="role">Role</label><br />
          <select id="role" name="role" defaultValue={values.role}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </p>
      )}
      {!user && (
        <p>
          <label htmlFor="password">Initial password (12 to 128 characters)</label><br />
          <input id="password" name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" />
        </p>
      )}
      <p>Email or role changes sign this user out. Their password stays the same when editing.</p>
      {ownAccount && <p>If you change your email, sign in again with the new address.</p>}
      {state.error && <p role="alert">{state.error}</p>}
      <button disabled={pending}>{pending ? 'Saving...' : user ? 'Save user' : 'Create user'}</button>
    </form>
  );
}
