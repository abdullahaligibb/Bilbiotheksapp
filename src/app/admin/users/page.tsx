import Link from 'next/link';
import { getPool } from '@/lib/db';
import { requireAdmin } from '@/lib/require-user';
import type { ManagedUser } from '@/lib/user-forms';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  await requireAdmin();
  // Read only the details needed for the list, never password hashes.
  const result = await getPool().query<ManagedUser>('SELECT id, name, email, role FROM users ORDER BY name, id');

  return (
    <main>
      <h1>User management</h1>
      <p><Link href="/admin">Administration</Link></p>
      <p><Link href="/admin/users/new">Add user</Link></p>
      <div className="table-scroll" role="region" aria-label="Users" tabIndex={0}>
        <table>
          <caption>Saved users</caption>
          <thead><tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Edit</th></tr></thead>
          <tbody>{result.rows.map(function (user) {
            return (
              <tr key={user.id}>
                <td>{user.name}</td><td>{user.email}</td><td>{user.role}</td>
                <td><Link href={`/admin/users/${user.id}`}>Edit {user.name}</Link></td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </main>
  );
}
