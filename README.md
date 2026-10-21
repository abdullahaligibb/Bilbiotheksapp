# Bibliotheksapp

Dieses Projekt ist die Grundlage für eine Bibliotheksapp mit Next.js und PostgreSQL.

Die App hat eine Anmeldung mit den Rollen Benutzer und Verwaltung. Nach dem Anmelden zeigt die Startseite weiterhin **Datenbankverbindung erfolgreich**. Die Nachricht wird aus der Datenbank gelesen. Die Verwaltung kann Bücher und einzelne Exemplare hinzufügen und bearbeiten. Suche und Ausleihe folgen später.

## Verwendete Werkzeuge

Stand der erfassten Versionen: 19.10.2026.

| Werkzeug | Version |
| --- | --- |
| VS Code | 1.142.0 |
| Git | 2.45.1.windows.1 |
| Node.js / npm | 24.9.0 / 11.6.0 |
| Docker Engine / Compose | 28.4.0 / 2.39.4-desktop.1 |
| PostgreSQL | 18.6, Image postgres:18 |
| Next.js / React | 16.4.2 / 19.3.0 |
| pg | 8.23.1 |
| Better Auth | 1.7.12 |
| TypeScript / ESLint | 5.9.3 / 9.39.5 |

Ich verwende Node.js 24.x. .nvmrc hält die verwendete Version fest. package-lock.json enthält die genauen Paketversionen. Das Docker-Image bleibt bei PostgreSQL 18, kann aber neuere Fehlerkorrekturen dieser Version erhalten.

## Projekt auf einem neuen Rechner einrichten

Docker Desktop muss laufen. Öffne den Projektordner in VS Code und dort ein PowerShell-Terminal. Die Ports 3000 und 5432 müssen frei sein.

Installiere die Pakete:

```powershell
npm.cmd ci
```

Erstelle die lokalen Konfigurationsdateien. Das ist nur nötig, wenn sie noch nicht vorhanden sind:

```powershell
Copy-Item .env.example .env
Copy-Item .env.local.example .env.local
```

Öffne beide neuen Dateien im Editor:

- In .env ersetzt du POSTGRES_PASSWORD durch ein eigenes lokales Passwort aus Buchstaben und Ziffern.
- In .env.local trägst du dasselbe Passwort in DATABASE_URL ein.
- Benutzer bibliothek_app, Datenbank bibliothek und localhost:5432 bleiben wie im Beispiel.
- BETTER_AUTH_SECRET braucht einen zufälligen Wert mit mindestens 32 Zeichen. Er schützt die Anmeldung. Du kannst ihn mit `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` erzeugen und lokal eintragen.
- BETTER_AUTH_URL ist hier http://localhost:3000. Öffne die App deshalb über localhost. Wenn du einen anderen Host oder Port nutzt, passe diese Adresse ebenfalls an und starte Next.js neu.
- DEMO_USER_PASSWORD und DEMO_ADMIN_PASSWORD sind zwei unterschiedliche lokale Passwörter mit jeweils 12 bis 128 Zeichen.

.env und .env.local enthalten echte Zugangsdaten und werden nicht mit Git geteilt. Die Beispieldateien enthalten keine echten Passwörter.

Danach:

```powershell
docker compose up -d --wait
npm.cmd run db:setup
npm.cmd run demo:users
npm.cmd run dev
```

Öffne http://localhost:3000/login. Die bereits eingerichtete Arbeitskopie enthält die neuen lokalen Einstellungen und Demo-Benutzer schon. Die vorhandenen Datenbank-Zugangsdaten wurden nicht geändert.

## Anmelden und abmelden

| Konto | E-Mail | Rolle |
| --- | --- | --- |
| Benutzer | user@example.test | user |
| Verwaltung | admin@example.test | admin |

Die Passwörter stehen nur in deiner ignorierten .env.local unter DEMO_USER_PASSWORD und DEMO_ADMIN_PASSWORD. Kopiere sie nicht in die Dokumentation oder ins Repository.

Nach dem Login siehst du deinen Namen, die Rolle und die Testnachricht. Über **Sign out** meldest du dich ab. Nur die Verwaltung kann /admin öffnen. Ein normaler Benutzer wird dort zur Seite **Access denied** weitergeleitet. Ohne Anmeldung führen die Startseite und /admin zur Loginseite.

npm run demo:users legt fehlende Demo-Konten an. Bestehende Konten, Passwörter und Rollen werden dabei nicht überschrieben. Es gibt noch keine öffentliche Registrierung und keine Benutzerverwaltung auf der Webseite.

## Bücher und Exemplare verwalten

1. Melde dich mit dem Verwaltungskonto an.
2. Öffne **Administration**, danach **Manage books and copies**.
3. Mit **Add book** erstellst du ein Buch. Titel und Autor sind Pflichtfelder. ISBN, Verlag, Erscheinungsjahr, Kategorie und Beschreibung sind vorerst optional.
4. Nach **Save book** öffnet sich die Bearbeitungsseite. Dort kannst du die Buchangaben ändern.
5. Unter **Add copy** trägst du die Inventarnummer und den Standort eines Exemplars ein. Beide Angaben sind Pflichtfelder.
6. Vorhandene Exemplare stehen beim jeweiligen Buch. Mit **Save copy** speicherst du Änderungen.

Die Übersicht unter /admin/books zeigt die Bücher mit ihrer Anzahl Exemplare. Jedes Exemplar bleibt mit seinem Buch verbunden. Beim Bearbeiten bleiben die IDs erhalten. Es gibt keine Löschfunktion für Bücher, Exemplare oder Ausleihen.

Der Server prüft bei jeder Speicheranfrage die Verwaltungsrolle und die Eingaben. Eine angegebene ISBN muss eine gültige ISBN-10 oder ISBN-13 sein. Leerzeichen und Bindestriche werden vor dem Speichern entfernt. Doppelte ISBNs und Inventarnummern werden mit einer Meldung abgelehnt. Eine leere ISBN wird als NULL gespeichert, damit mehrere Bücher ohne ISBN möglich sind. Die Datenbank schützt eindeutige Werte auch bei gleichzeitigen Anfragen. SQL-Platzhalter trennen die Eingaben vom SQL-Befehl.

Die Textfelder haben einfache Längengrenzen: Titel, Autor und Verlag je 300 Zeichen, Kategorie 100, Beschreibung 5000, Inventarnummer 100 und Standort 200. Das Erscheinungsjahr liegt zwischen 1 und 9999. Diese Regeln werden auch auf dem Server geprüft. Vorhandene Daten werden dadurch nicht automatisch verändert.

## Was die Befehle machen

- docker compose up startet PostgreSQL im Hintergrund und wartet, bis die Datenbank bereit ist.
- npm run db:setup führt database/setup.sql, 001_library_schema.sql und 002_authentication.sql in dieser Reihenfolge aus. Die letzten beiden Dateien stehen unter database/migrations. Vorhandene Daten bleiben erhalten. Es zeigt keine Datensätze im Terminal an.
- npm run demo:users erstellt die beiden lokalen Demo-Konten. Better Auth erstellt die Passwort-Hashes.
- npm run dev startet die Webseite und den Next.js-Server auf dem Rechner.

setup.sql erstellt die Testnachricht und die einfache Buchtabelle. 001_library_schema.sql erweitert das Bibliotheksmodell. 002_authentication.sql ergänzt die Anmeldung. Jede Erweiterung verwendet eine Transaktion: Entweder wird sie vollständig ausgeführt oder bei einem Fehler zurückgenommen. Die Dateien können erneut ausgeführt werden. Weitere Migrationsdateien werden noch nicht automatisch erkannt.

## Ordner und Dateien

| Datei oder Ordner | Aufgabe |
| --- | --- |
| src/app/page.tsx | Liest die Testnachricht und zeigt sie an |
| src/app/layout.tsx | Gemeinsamer HTML-Rahmen der Seite |
| src/lib/db.ts | Verwaltet die Verbindung zur Datenbank |
| src/lib/auth.ts | Einstellungen von Better Auth und Rollenfeld |
| src/lib/require-user.ts | Prüft Anmeldung und Verwaltungsrolle auf dem Server |
| src/lib/auth-client.ts | Verbindung der Login-Buttons zu Better Auth |
| src/app/login/ | Loginseite und Formular |
| src/app/api/auth/[...all]/route.ts | Empfängt Login- und Logout-Anfragen |
| src/app/admin/page.tsx | Geschützte Startseite für die Verwaltung |
| src/app/admin/books/ | Übersicht, Buchformular und Formulare für Exemplare |
| src/app/admin/books/actions.ts | Prüft Rechte und Eingaben und speichert Bücher und Exemplare |
| src/lib/library-forms.ts | Gemeinsame Datentypen und einfache Prüfungen für IDs und ISBN |
| scripts/setup-db.mjs | Liest die SQL-Dateien und führt sie aus |
| scripts/create-demo-users.mjs | Erstellt fehlende Demo-Benutzer mit Passwort-Hashes |
| database/setup.sql | Erstellt die Grundlage und die Testnachricht |
| database/migrations/001_library_schema.sql | Ergänzt die Bibliothekstabellen |
| database/migrations/002_authentication.sql | Ergänzt die Tabellen für die Anmeldung |
| compose.yaml | Einstellungen für PostgreSQL in Docker |
| docs/projektverlauf.md | Entscheidungen und Notizen für die Präsentation |

## Datenmodell

| Tabelle | Inhalt |
| --- | --- |
| books | Angaben zum Buch, zum Beispiel Titel, Autor und ISBN |
| copies | Die einzelnen Exemplare mit Inventarnummer und Standort |
| users | Benutzer mit E-Mail, Passwort-Hash und Rolle |
| loans | Ausleihen mit Benutzer, Exemplar und Datumsangaben |
| setup_check | Die Testnachricht für den Verbindungstest |
| auth_accounts | Login-Methode und Passwort-Hash eines Benutzers |
| auth_sessions | Aktuelle Anmeldungen mit Ablaufdatum |
| auth_verifications | Vorbereitung für Bestätigungsvorgänge der Auth-Bibliothek |

Ein Buch kann mehrere Exemplare haben. Eine Ausleihe gehört zu einem Benutzer und einem Exemplar. Ein Exemplar darf nur eine aktive Ausleihe haben.

Die neuen Buchfelder sind vorerst optional, damit bisherige Formulare weiter funktionieren. books.borrowed bleibt für den alten Übungscode bestehen. Im geplanten Ausleihsystem wird die Verfügbarkeit aus loans berechnet.

Better Auth speichert Passwort-Hashes in auth_accounts.password_hash. Die frühere Spalte users.password_hash bleibt erhalten, wird für neue Anmeldungen aber nicht verwendet und darf leer sein. Die vorhandenen Benutzer-IDs bleiben bestehen, damit die Verbindungen zu loans weiter passen.

Die Rollen heissen user und admin. Das sind Rollen in der App, keine PostgreSQL-Konten. Die Rolle kommt vom Server. Ein Benutzer kann sie nicht im Loginformular oder mit einer Anfrage selbst ändern. Für spätere Verwaltungsaktionen muss requireAdmin am Anfang der jeweiligen Serverfunktion aufgerufen werden.

Die Anmeldung gilt bis zu acht Stunden. Better Auth verwaltet das Sitzungscookie und prüft die Sitzung in PostgreSQL. Das Cookie ist HttpOnly und verwendet SameSite=Lax. Die App liest die Rolle bei geschützten Seiten aus der geprüften Sitzung. Wiederholte Login-Anfragen werden begrenzt. Diese Begrenzung läuft für das lokale Projekt im Speicher eines Servers; mehrere Server würden einen gemeinsamen Speicher benötigen.

## Verbindungstest selbst ausprobieren

Die Startseite liest setup_check bei jedem Seitenaufruf. Die Abfrage läuft auf dem Server. Der Browser erhält das Datenbankpasswort nicht.

Öffne ein zweites Terminal im Projektordner:

```powershell
docker compose exec db psql -U bibliothek_app -d bibliothek
```

In psql:

```sql
SELECT * FROM setup_check;
UPDATE setup_check SET message = 'Hallo aus meiner Datenbank!' WHERE id = 1;
```

Lade die Webseite neu. Jetzt sollte die neue Nachricht erscheinen. Mit `\q` verlässt du psql.

## Stoppen und Daten behalten

Den Next.js-Server stoppst du mit Strg+C in seinem Terminal.

```powershell
docker compose down
```

Das Volume postgres_data speichert die Daten. Sie bleiben beim normalen Stoppen erhalten. Die zusätzliche Option -v würde das Volume und seine Daten löschen.

Zum Prüfen der Speicherung kannst du die Datenbank stoppen, wieder starten und die Daten erneut lesen. Das ist ein eigener Testschritt.

## Code prüfen

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

Für einen lokalen Start des fertigen Builds verwendest du npm.cmd run start. Stoppe vorher einen laufenden Entwicklungsserver auf demselben Port.

## Warum diese Pakete?

- pg verbindet den Server mit PostgreSQL. Ich schreibe SQL direkt und verwende kein ORM.
- @types/pg hilft TypeScript beim Prüfen des Datenbankcodes.
- server-only verhindert, dass Datenbankcode in Browser-Komponenten importiert wird.
- @next/env lädt die Umgebungsdateien für das Setup-Skript.
- better-auth übernimmt Passwort-Hashes, Login, Logout und Sitzungen. Die Bibliothek läuft in der App und verwendet die PostgreSQL-Datenbank.
- ESLint prüft typische Fehler im Code.

## Häufige Probleme

- Docker nicht erreichbar: Docker Desktop öffnen und mit docker info prüfen.
- PowerShell blockiert npm.ps1: npm.cmd verwenden.
- Port 5432 belegt: Den Host-Port in compose.yaml und DATABASE_URL passend ändern.
- Passwort abgelehnt: Beide Umgebungsdateien vergleichen. Ein neues Passwort in .env ändert kein Passwort einer bereits eingerichteten Datenbank.
- Änderung an .env.local: Den Next.js-Server stoppen und neu starten.
- Tabelle fehlt: Die verwendete Datenbank prüfen und npm.cmd run db:setup ausführen.
- Fehler bei instant oder force-dynamic: Dieses Projekt verwendet cacheComponents: false und dynamic = 'force-dynamic'.

## Bekannte Paketwarnung

Bei der Prüfung am 19.10.2026 meldete npm audit fünf hohe Einträge. Sie gehören zur selben Kette in den Entwicklungswerkzeugen: eslint-config-next -> @next/eslint-plugin-next -> fast-glob -> micromatch -> braces.

Die Schwachstelle betrifft braces 3.0.3. Stark verschachtelte Muster können den Node.js-Prozess zum Absturz bringen. Bei dieser Prüfung gab es laut [Sicherheitsmeldung](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) keine korrigierte Version. npm.cmd audit --omit=dev meldete null bekannte Schwachstellen in den Produktionspaketen.

Der vorgeschlagene automatische Fix hätte eslint-config-next auf Version 14 zurückgesetzt. Dieser Wechsel wurde nicht durchgeführt, weil das Projekt Next.js 16 verwendet. Die Warnung bleibt offen und muss bei späteren Paketupdates erneut geprüft werden. Die damalige Prüfung ist keine allgemeine Sicherheitsgarantie.

## Git und Übergabe

Quellcode, SQL-Dateien, README, compose.yaml, package-lock.json und die Beispieldateien gehören ins Repository. .env, .env.local, node_modules und .next werden ausgeschlossen.

Die lokale Datenbank verwendet für die Entwicklung einen PostgreSQL-Superuser. Für einen späteren Einsatz ausserhalb der lokalen Übung müssen die Datenbankrechte passend eingerichtet werden.

Die bisherigen Schritte und die offenen Aufgaben stehen in [docs/projektverlauf.md](docs/projektverlauf.md).

## Offizielle Dokumentation

- [Next.js](https://nextjs.org/docs/app/getting-started/installation)
- [node-postgres](https://node-postgres.com/features/queries)
- [PostgreSQL-Image](https://hub.docker.com/_/postgres)
