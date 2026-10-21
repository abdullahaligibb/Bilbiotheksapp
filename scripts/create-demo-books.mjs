import nextEnv from '@next/env';
import pg from 'pg';

nextEnv.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL in .env.local');

// All book details are fictional. The ISBNs are example values with valid check digits.
const demoBooks = [
  {
    title: 'Das Geheimnis im alten Bahnhof',
    author: 'Mara Keller',
    isbn: '9780000001016',
    publisher: 'Lernlicht Verlag',
    year: 2022,
    category: 'Krimi',
    description: 'Fiktives Beispielbuch: Zwei Freunde entdecken eine rätselhafte Nachricht im Bahnhof.',
    copies: [
      { number: 'DEMO-B001-01', location: 'Regal A1' },
      { number: 'DEMO-B001-02', location: 'Regal A1' },
    ],
  },
  {
    title: 'Eine Reise durch die Sterne',
    author: 'Noah Sommer',
    isbn: '9780000001023',
    publisher: 'Sternpfad Verlag',
    year: 2024,
    category: 'Abenteuer',
    description: 'Fiktives Beispielbuch: Eine kleine Forschungscrew besucht unbekannte Planeten.',
    copies: [
      { number: 'DEMO-B002-01', location: 'Regal B2' },
      { number: 'DEMO-B002-02', location: 'Regal B2' },
    ],
  },
  {
    title: 'Programmieren Schritt für Schritt',
    author: 'Lea Winter',
    isbn: '9780000001030',
    publisher: 'Codegarten Verlag',
    year: 2025,
    category: 'Informatik',
    description: 'Fiktives Beispielbuch: Ein einfacher Einstieg in Variablen, Bedingungen und Schleifen.',
    copies: [
      { number: 'DEMO-B003-01', location: 'Regal C3' },
      { number: 'DEMO-B003-02', location: 'Regal C3' },
    ],
  },
];

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  const connection = await pool.connect();
  try {
    await connection.query('BEGIN');
    for (const book of demoBooks) {
      // Add a missing book. Never overwrite an existing book with the same ISBN.
      const added = await connection.query(
        `INSERT INTO books (title, author, isbn, publisher, publication_year, category, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (isbn) DO NOTHING RETURNING id`,
        [book.title, book.author, book.isbn, book.publisher, book.year, book.category, book.description],
      );
      let bookId = added.rows[0]?.id;
      if (!bookId) {
        // If the title or author was changed, leave that book alone as well.
        const existing = await connection.query(
          'SELECT id FROM books WHERE isbn=$1 AND title=$2 AND author=$3',
          [book.isbn, book.title, book.author],
        );
        if (existing.rows.length === 0) continue;
        bookId = existing.rows[0].id;
      }

      for (const copy of book.copies) {
        // Keep existing inventory numbers, locations and loans unchanged.
        await connection.query(
          `INSERT INTO copies (book_id, inventory_number, location)
           VALUES ($1, $2, $3) ON CONFLICT (inventory_number) DO NOTHING`,
          [bookId, copy.number, copy.location],
        );
      }
    }
    await connection.query('COMMIT');
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
} finally {
  await pool.end();
}
