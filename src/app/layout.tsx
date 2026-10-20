import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Bibliotheksapp',
  description: 'Next.js und PostgreSQL: Verbindungstest meiner Bibliotheksapp.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
