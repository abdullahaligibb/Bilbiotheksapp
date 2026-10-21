export type ManagedUser = {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
};

// Keep this format compatible with the email check in our login library.
export function validEmail(email: string) {
  if (email.length > 254) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;

  const name = parts[0];
  const domain = parts[1];
  if (name.startsWith('.') || name.endsWith('.') || name.includes('..')) return false;
  if (!/^[a-z0-9_'+.\-]+$/i.test(name) || name.endsWith("'")) return false;

  return /^(?:[a-z0-9][a-z0-9\-]*\.)+[a-z]{2,}$/i.test(domain);
}
