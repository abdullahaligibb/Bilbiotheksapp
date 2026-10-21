import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bibliotheksapp',
  description: 'Bücher suchen, Exemplare ausleihen und Ausleihen verwalten.',
};
type LayoutProperties = {
  readonly children: React.ReactNode;
};

export default function RootLayout(properties: LayoutProperties) {
  return (
    <html lang="de">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <header className="site-header">
          <Link className="site-name" href="/">Bibliotheksapp</Link>
        </header>
        <div id="main-content" tabIndex={-1}>{properties.children}</div>
      </body>
    </html>
  );
}
