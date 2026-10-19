import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Bibliothek | Mein erster Meilenstein',
  description: 'Next.js und PostgreSQL: Verbindungstest meiner Bibliotheksapp.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
