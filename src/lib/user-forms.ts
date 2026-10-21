export type ManagedUser = {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
};
