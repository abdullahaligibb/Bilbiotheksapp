# Bibliotheksapp - Meilenstein 1

Eine lokale Next.js-App liest eine gespeicherte Testinformation serverseitig aus PostgreSQL. Die Datenbank läuft in Docker. Bücherverwaltung und Ausleihe folgen später.

## Voraussetzungen und Versionen

Stand: 19.10.2026. Durchgehende Windows-Umgebung mit PowerShell.

| Werkzeug | Verwendete Version |
| --- | --- |
| VS Code | 1.142.0 |
| Git | 2.45.1.windows.1 |
| Node.js / npm | 24.9.0 / 11.6.0 |
| Docker Engine / Compose | 28.4.0 / 2.39.4-desktop.1 |
| PostgreSQL | 18.6 (Image postgres:18) |
| Next.js / @next/env | 16.4.2 |
| React / React DOM | 19.3.0 |
| pg | 8.23.1 |
| TypeScript / ESLint | 5.9.3 / 9.39.5 |

Node 24.x wird in package.json vorausgesetzt; .nvmrc enthält 24.9.0. Exakte npm-Abhängigkeiten stehen in package-lock.json. Docker Desktop muss laufen. Ports 3000 und 5432 müssen frei sein. postgres:18 kann neuere Patchversionen beziehen und bleibt bei Hauptversion 18.

## Frische Arbeitskopie einrichten

Öffne diesen Ordner in VS Code und ein PowerShell-Terminal darin. Ich verwende npm.cmd, damit eine PowerShell-Ausführungsrichtlinie für npm.ps1 keine Probleme verursacht.

```powershell
npm.cmd ci
Copy-Item .env.example .env
Copy-Item .env.local.example .env.local
```

Bearbeite beide neuen Dateien im Editor:

- .env: Ersetze POSTGRES_PASSWORD durch ein eigenes lokales Passwort aus Buchstaben und Ziffern.
- .env.local: Ersetze den Passwort-Platzhalter in DATABASE_URL durch genau dasselbe Passwort.
- Benutzer bibliothek_app, Datenbank bibliothek und localhost:5432 bleiben wie in den Beispielen.

Die bereits eingerichtete Arbeitskopie besitzt diese Dateien mit einem zufälligen lokalen Passwort. Zum Starten musst du dort nichts ändern. Die echten Dateien werden von Git ignoriert.

```powershell
docker compose up -d --wait
npm.cmd run db:setup
npm.cmd run dev
```

Öffne http://localhost:3000. Erwartet: **Datenbank verbunden** und **Datenbankverbindung erfolgreich**.

## Was passiert dabei?

1. compose.yaml startet PostgreSQL 18 und bindet Port 5432 nur an die lokale Schnittstelle.
2. scripts/setup-db.mjs lädt mit @next/env die Next.js-Umgebung einschließlich .env.local.
3. database/setup.sql erzeugt setup_check mit id und message und legt eine Testzeile an. Wiederholtes Ausführen erhält vorhandene Daten.
4. src/lib/db.ts erzeugt einen wiederverwendeten Pool von Datenbankverbindungen. server-only verhindert den Import in Client Components.
5. src/app/page.tsx ist eine async Server Component. Sie führt SELECT id, message FROM setup_check ORDER BY id aus und rendert die echten Ergebnisse.
6. force-dynamic und deaktivierte Cache Components sorgen für eine frische Abfrage bei jedem Seitenabruf. Der Knopf lädt die Seite neu.

Datenweg: Browser -> Next.js auf Windows -> PostgreSQL in Docker -> Next.js -> sichtbarer Text. Der Browser erhält kein Datenbankpasswort.

## Selbst ausprobieren: Nachricht ändern

Lass den Entwicklungsserver in seinem Terminal laufen. Öffne ein zweites Terminal im Projektordner:

```powershell
docker compose exec db psql -U bibliothek_app -d bibliothek
```

Gib in psql ein:

```sql
SELECT * FROM setup_check;
UPDATE setup_check SET message = 'Hallo aus meiner Datenbank!' WHERE id = 1;
SELECT * FROM setup_check;
```

Drücke auf der Webseite **Erneut aus der Datenbank lesen**. Der neue Text muss erscheinen. Verlasse psql mit `\q`.

Zum Zurücksetzen der Nachricht:

```sql
UPDATE setup_check SET message = 'Datenbankverbindung erfolgreich' WHERE id = 1;
```

## Datenpersistenz prüfen

Beende eine offene psql-Sitzung und führe aus:

```powershell
docker compose down
docker compose up -d --wait
docker compose exec -T db psql -U bibliothek_app -d bibliothek -c "SELECT * FROM setup_check;"
```

Lade auch die App neu. Die Zeile bleibt vorhanden: Das benannte Volume postgres_data speichert die Daten unabhängig vom Container. Die zusätzliche Option `-v` beim Entfernen würde die lokalen Daten löschen und gehört nicht zum normalen Stoppen.

## Starten, stoppen und prüfen

```powershell
# Datenbank starten
docker compose up -d --wait
# Entwicklungsserver starten
npm.cmd run dev
# Entwicklungsserver stoppen: Strg+C im zugehörigen Terminal
# Datenbank stoppen, Daten bleiben erhalten
docker compose down
# Code prüfen
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
# Produktionsbuild lokal starten, Entwicklungsserver vorher stoppen
npm.cmd run start
```

## Entscheidungen

- TypeScript: erkennt Typfehler vor dem Start.
- App Router und Server Component: direkte Datenbankabfrage auf dem Server ohne zusätzlichen API-Endpunkt.
- pg: kleiner PostgreSQL-Treiber; SQL bleibt sichtbar und für diesen Meilenstein erklärbar. Kein ORM und keine ORM-Migrationen.
- SQL-Skript: wiederholbarer Schemaaufbau für den Verbindungstest. Künftige Schemaänderungen sollten als versionierte Migrationen ergänzt werden.
- CSS: einfache Gestaltung ohne zusätzliche UI-Abhängigkeit.
- ESLint: prüft typische JavaScript-, React- und Next.js-Probleme.
- @next/env: das Setup-Skript verwendet dieselben Umgebungsdateien wie Next.js.
- Systemschriften: der Build benötigt keinen Font-Download.

## Fehlerbehebung

- Docker nicht erreichbar: Docker Desktop starten; docker info muss den Server erreichen.
- PowerShell blockiert npm.ps1: npm.cmd verwenden; keine systemweite Richtlinie ändern.
- Port 5432 belegt: in compose.yaml den Host-Port auf 5433 ändern und in .env.local ebenfalls localhost:5433 verwenden.
- Passwort abgelehnt: beide Dateien vergleichen. POSTGRES_* initialisiert nur ein leeres Volume; eine Änderung in .env ändert kein bestehendes Datenbankpasswort.
- Nach Änderungen an .env.local: Next.js mit Strg+C beenden und neu starten.
- Verbindung prüfen: Container mit docker compose ps prüfen, dann npm.cmd run db:setup ausführen.
- Leere Tabelle: npm.cmd run db:setup erzeugt die Testzeile.
- Build-Konflikt mit force-dynamic: Cache Components sind für diesen Verbindungstest ausdrücklich deaktiviert.
- @next/env in einem .mjs-Skript: CommonJS-Defaultimport verwenden und nextEnv.loadEnvConfig aufrufen.

## Bekannte Abhängigkeitsmeldung

npm audit meldete beim Einrichten fünf hohe Meldungen in einer gemeinsamen Entwicklungstool-Kette: eslint-config-next -> @next/eslint-plugin-next -> fast-glob -> micromatch -> braces (GHSA-vfj7-8cjw-p6xm). Der automatisch vorgeschlagene Fix wäre ein Downgrade von eslint-config-next auf 14.2.35. Dieses wurde nicht angewendet, da die Konfiguration zu Next.js 16 passen soll. Vor Weiterentwicklung erneut npm.cmd audit prüfen. Dies ist kein vollständiger Sicherheitsaudit.

## Git und Übergabe

Quellcode, compose.yaml, SQL, README, package-lock.json und beide Beispieldateien gehören ins Repository. .env, .env.local, node_modules und .next sind ausgeschlossen. Vor einem Commit git status prüfen. Diese lokale App verwendet einen PostgreSQL-Superuser für Entwicklung; für eine Bereitstellung wäre ein eigenes Berechtigungskonzept nötig.

## Offizielle Dokumentation

- [Next.js Installation](https://nextjs.org/docs/app/getting-started/installation)
- [Server Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [node-postgres](https://node-postgres.com/features/queries)
- [PostgreSQL-Image](https://hub.docker.com/_/postgres)
