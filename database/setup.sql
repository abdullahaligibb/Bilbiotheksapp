-- You can run this file again. Existing messages are kept.
CREATE TABLE IF NOT EXISTS setup_check (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  message text NOT NULL
);
INSERT INTO setup_check (message)
SELECT 'Datenbankverbindung erfolgreich'
WHERE NOT EXISTS (SELECT 1 FROM setup_check);

CREATE TABLE IF NOT EXISTS books (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL,
  author text NOT NULL,
  borrowed boolean NOT NULL DEFAULT false
);
