-- Add the library tables. Keep existing books and test messages.
BEGIN;

-- BOOKS: the details of a book, such as its author and ISBN.
-- These new fields are optional for now, so older forms still work.
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS isbn text,
  ADD COLUMN IF NOT EXISTS publisher text,
  ADD COLUMN IF NOT EXISTS publication_year integer,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS description text;

CREATE UNIQUE INDEX IF NOT EXISTS books_isbn_unique ON books (isbn);

-- USERS: people who use the app. These are not database login accounts.
-- The login code will save password hashes here, not plain passwords.
CREATE TABLE IF NOT EXISTS users (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'))
);

-- The same email with different capital letters is still a duplicate.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (lower(email));

-- COPIES: each physical book has its own inventory number.
CREATE TABLE IF NOT EXISTS copies (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  inventory_number text NOT NULL UNIQUE,
  book_id integer NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
  location text NOT NULL
);

CREATE INDEX IF NOT EXISTS copies_book_id_index ON copies (book_id);

-- LOANS: a loan is active until it has a return date.
CREATE TABLE IF NOT EXISTS loans (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  copy_id integer NOT NULL REFERENCES copies(id) ON DELETE RESTRICT,
  borrowed_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_at timestamptz NOT NULL,
  returned_at timestamptz,
  CONSTRAINT loans_due_date_check CHECK (due_at >= borrowed_at),
  CONSTRAINT loans_return_date_check
    CHECK (returned_at IS NULL OR returned_at >= borrowed_at)
);

CREATE INDEX IF NOT EXISTS loans_user_id_index ON loans (user_id);
CREATE INDEX IF NOT EXISTS loans_copy_id_index ON loans (copy_id);

-- Only one active loan is allowed per copy, even with requests at the same time.
CREATE UNIQUE INDEX IF NOT EXISTS loans_one_active_per_copy
  ON loans (copy_id)
  WHERE returned_at IS NULL;

COMMIT;
