import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Bibliotheksapp',
  description: 'Next.js und PostgreSQL: Verbindungstest meiner Bibliotheksapp.',
};
type LayoutProperties = {
  readonly children: React.ReactNode;
};

export default function RootLayout(properties: LayoutProperties) {
  return (
    <html lang="de">
      <body>{properties.children}</body>
    </html>
  );
}
