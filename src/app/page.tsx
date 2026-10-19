import { getPool } from '@/lib/db';

// Read PostgreSQL on every page request, rather than at build time.
export const dynamic = 'force-dynamic';

export default async function Home() {
  let messages: { id: number; message: string }[] = [];
  let failed = false;
  try {
    const result = await getPool().query<{ id: number; message: string }>(
      'SELECT id, message FROM setup_check ORDER BY id',
    );
    messages = result.rows;
  } catch {
    failed = true;
    console.error('Database setup check failed. Check Docker, .env.local and npm run db:setup.');
  }
  return (
    <main>
      <header><span className="brand">B / BIBLIOTHEK</span><span>MEILENSTEIN 01</span></header>
      <section className="intro">
        <p className="eyebrow">MEINE ERSTE NEXT.JS-APP</p>
        <h1>Ein guter Anfang.<br /><span>Für viele Geschichten.</span></h1>
        <p>Die Grundlage meiner Bibliotheksapp steht: Next.js und PostgreSQL arbeiten zusammen.</p>
      </section>
      <section className="card" aria-labelledby="connection-heading">
        <p className="eyebrow">LIVE AUS POSTGRESQL</p>
        <h2 id="connection-heading">{failed ? 'Verbindung prüfen' : messages.length ? 'Datenbank verbunden' : 'Noch keine Testdaten'}</h2>
        {failed ? (
          <p role="alert">Starte Docker mit <code>docker compose up -d --wait</code>, prüfe <code>.env.local</code> und führe <code>npm run db:setup</code> aus.</p>
        ) : messages.length ? (
          <ul>{messages.map(({ id, message }) => <li key={id}><span className="dot" />{message}<small>ZEILE {id}</small></li>)}</ul>
        ) : <p>Erzeuge die Testzeile mit <code>npm run db:setup</code>.</p>}
        <form action="/" method="get"><button className="refresh" type="submit">Erneut aus der Datenbank lesen ↗</button></form>
      </section>
      <section className="steps" aria-label="So funktioniert die Verbindung">
        <article><span>01 / OBERFLÄCHE</span><h3>Browser</h3><p>Du öffnest diese Seite auf deinem Rechner.</p></article>
        <article><span>02 / SERVER</span><h3>Next.js</h3><p>Die Server Component fragt die Testinformation ab.</p></article>
        <article><span>03 / SPEICHER</span><h3>PostgreSQL</h3><p>Docker betreibt die Datenbank. Ein Volume bewahrt die Daten.</p></article>
      </section>
      <footer>Bibliotheksapp · Lokale Entwicklungsumgebung</footer>
    </main>
  );
}
