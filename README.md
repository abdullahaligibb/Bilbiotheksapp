# Bibliotheksapp

Dieses Projekt ist die Grundlage für eine Bibliotheksapp mit Next.js und PostgreSQL.

Die Startseite zeigt **Datenbankverbindung erfolgreich**. Die Nachricht wird aus der Datenbank gelesen. Die Tabellen für Bücher, Exemplare, Benutzer und Ausleihen sind vorbereitet. Anmeldung und die neuen Funktionen auf der Webseite folgen später.

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

.env und .env.local enthalten echte Zugangsdaten und werden nicht mit Git geteilt. Die Beispieldateien enthalten keine echten Passwörter.

Danach:

```powershell
docker compose up -d --wait
npm.cmd run db:setup
npm.cmd run dev
```

Öffne die Adresse aus dem Terminal, normalerweise http://localhost:3000.

## Was die Befehle machen

- docker compose up startet PostgreSQL im Hintergrund und wartet, bis die Datenbank bereit ist.
- npm run db:setup führt database/setup.sql und danach database/migrations/001_library_schema.sql aus. Vorhandene Daten bleiben erhalten. Es zeigt keine Datensätze im Terminal an.
- npm run dev startet die Webseite und den Next.js-Server auf dem Rechner.

Die erste SQL-Datei erstellt die Testnachricht und die einfache Buchtabelle. Die zweite erweitert das Datenmodell. Sie verwendet eine Transaktion: Entweder wird diese Erweiterung vollständig ausgeführt oder bei einem Fehler zurückgenommen. Beide Dateien können erneut ausgeführt werden. Weitere Migrationsdateien werden noch nicht automatisch erkannt.

## Ordner und Dateien

| Datei oder Ordner | Aufgabe |
| --- | --- |
| src/app/page.tsx | Liest die Testnachricht und zeigt sie an |
| src/app/layout.tsx | Gemeinsamer HTML-Rahmen der Seite |
| src/lib/db.ts | Verwaltet die Verbindung zur Datenbank |
| scripts/setup-db.mjs | Liest die SQL-Dateien und führt sie aus |
| database/setup.sql | Erstellt die Grundlage und die Testnachricht |
| database/migrations/001_library_schema.sql | Ergänzt die Bibliothekstabellen |
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

Ein Buch kann mehrere Exemplare haben. Eine Ausleihe gehört zu einem Benutzer und einem Exemplar. Ein Exemplar darf nur eine aktive Ausleihe haben.

Die neuen Buchfelder sind vorerst optional, damit bisherige Formulare weiter funktionieren. books.borrowed bleibt für den alten Übungscode bestehen. Im geplanten Ausleihsystem wird die Verfügbarkeit aus loans berechnet.

password_hash ist erst die vorbereitete Spalte. Die Anmeldung und das Erstellen sicherer Passwort-Hashes fehlen noch. Die Rollen heissen user und admin. Das sind Rollen in der App, keine PostgreSQL-Konten.

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
