# Bibliotheksapp

Dieses Projekt ist die Grundlage für eine Bibliotheksapp mit Next.js und PostgreSQL.

Die App hat eine Anmeldung mit den Rollen Benutzer und Verwaltung. Nach dem Anmelden zeigt die Startseite weiterhin **Datenbankverbindung erfolgreich**. Die Nachricht wird aus der Datenbank gelesen. Die Verwaltung kann Bücher, einzelne Exemplare und Benutzer hinzufügen und bearbeiten sowie Rückgaben erfassen. Alle angemeldeten Benutzer können nach Büchern suchen, verfügbare Exemplare für sich ausleihen und ihre eigenen Ausleihen ansehen. Überfällige Ausleihen werden markiert. Die Verwaltung kann alle überfälligen Exemplare auflisten.

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
| Playwright, nur für Browsertests | 1.62.1 |
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

npm run demo:users legt fehlende Demo-Konten an. Bestehende Konten, Passwörter und Rollen werden dabei nicht überschrieben. Es gibt weiterhin keine öffentliche Registrierung. Weitere Konten erstellt die Verwaltung auf der Webseite.

## Benutzer verwalten


1. Melde dich als Verwaltung an und öffne **Administration → Manage users**.
2. Die Übersicht zeigt Name, E-Mail und Rolle der gespeicherten Benutzer.
3. Mit **Add user** erstellst du ein Konto mit Name, E-Mail, Rolle und Anfangspasswort. Das Passwort muss 12 bis 128 Zeichen haben.
4. Mit **Edit** kannst du Name, E-Mail und Rolle eines Benutzers ändern. Das Passwort bleibt dabei gleich.

Ein neues Konto kann sich danach über die normale Loginseite anmelden. Passwörter werden mit der vorhandenen Better-Auth-Funktion gehasht. Der Hash steht in auth_accounts; weder Passwort noch Hash werden in der Benutzerübersicht angezeigt. Nach einem Formularfehler muss das Anfangspasswort neu eingegeben werden.

Namen dürfen 1 bis 100 Zeichen lang sein. E-Mail-Adressen werden auf ein mit dem Login kompatibles Format und höchstens 254 Zeichen geprüft und klein gespeichert. Zum Beispiel werden ein Punkt am Anfang und doppelte Punkte im Namen abgelehnt. Eine E-Mail darf nur einmal vorkommen, auch wenn sie anders grossgeschrieben wird. Erlaubte Rollen sind user und admin. Alle Prüfungen finden zusätzlich auf dem Server statt. Die Formatprüfung bestätigt nicht, dass die E-Mail-Adresse tatsächlich existiert.

Werden E-Mail oder Rolle geändert, beendet der Server die aktuellen Sitzungen dieses Benutzers. Beim Ändern der eigenen E-Mail muss man sich mit der neuen Adresse erneut anmelden. Die eigene Verwaltungsrolle kann man nicht entfernen. So kann die letzte Verwaltungsperson sich nicht aussperren. Falls eine andere Verwaltungsperson die Rolle ändern soll, muss sie das mit ihrem eigenen Konto tun.

Das Speichern läuft in einer Transaktion. Bei einem neuen Konto werden Benutzer und Passwortkonto gemeinsam erstellt. Eine kurze Tabellensperre verhindert, dass zwei Verwaltungsanfragen sich gleichzeitig gegenseitig die Rechte entziehen. Nach dieser Sperre werden die Rechte erneut aus der Datenbank gelesen. Benutzer-IDs und bestehende Ausleihen bleiben beim Bearbeiten erhalten. Eine Löschfunktion, Passwort-Zurücksetzen und eine automatische E-Mail mit Zugangsdaten sind noch nicht eingebaut.

## Bücher suchen

1. Melde dich an und öffne auf der Startseite **Search books**.
2. Gib einen Titel, Autor oder eine ISBN ein und drücke **Search**. Ein Suchfeld prüft alle drei Angaben. Ein Teil des Textes reicht aus.
3. Die Tabelle zeigt Titel, Autor, ISBN und verfügbare Exemplare der passenden Bücher, zum Beispiel **2 of 4**. Ohne ISBN steht dort ein Strich.
4. Mit **Clear search** löschst du die Suche. Ein leeres Suchfeld zeigt den Katalog.

Die Suche beachtet Gross- und Kleinschreibung nicht. Bei einer ISBN kannst du Leerzeichen und Bindestriche mit eingeben. Die Webseite zeigt höchstens 100 Treffer und bittet bei weiteren Treffern um einen genaueren Suchbegriff. Wenn nichts passt, erscheint **No books found**. Der Suchbegriff darf höchstens 300 Zeichen haben.

Die Suche ist für beide Rollen erreichbar. Nur die Verwaltung sieht daneben einen Link zum Bearbeiten. Ohne Anmeldung führt /books zur Loginseite. Der Suchbegriff steht als q in der Adresse, zum Beispiel /books?q=Harry. Dadurch bleibt die Suche beim Neuladen erhalten.

Das Formular verwendet eine normale GET-Anfrage. Die Seite liest den Suchbegriff und fragt PostgreSQL auf dem Server ab. SQL-Platzhalter halten den Suchtext vom SQL-Befehl getrennt. POSITION prüft, ob der Text im Titel, Autor oder in der ISBN vorkommt. Prozentzeichen und Unterstriche werden als normale Zeichen behandelt. Dafür sind keine zusätzliche Suchbibliothek und keine neuen Tabellen nötig.

## Verfügbare Exemplare ansehen

Klicke in der Suche auf einen Buchtitel. Die Buchseite zeigt die Buchangaben und alle zugehörigen Exemplare mit Inventarnummer, Standort und Status:

- **Available**: Das Exemplar hat keine aktive Ausleihe und ist verfügbar.
- **On loan**: Das Exemplar hat eine Ausleihe ohne Rückgabedatum und ist ausgeliehen.

Eine frühere, abgeschlossene Ausleihe macht ein Exemplar nicht mehr unverfügbar. Auch mehrere frühere Ausleihen werden nicht mehrfach gezählt. Eine überfällige Ausleihe bleibt aktiv, bis eine Rückgabe erfasst wurde. Ein Buch ohne Exemplare zeigt **0 of 0** und eine passende Meldung.

Beide Rollen dürfen diese Angaben nach dem Anmelden sehen. Namen und E-Mail-Adressen der ausleihenden Personen werden nicht angezeigt. Nur die Verwaltung sieht den Bearbeitungslink. Die Angaben werden bei jedem neuen Seitenaufruf aus der Datenbank gelesen. Sie sind eine Anzeige des aktuellen Zustands und reservieren kein Exemplar. Die eigentliche Prüfung und Speicherung erfolgt beim Klick auf den Ausleihbutton.

## Ein Exemplar ausleihen

1. Öffne über die Suche ein Buch.
2. Klicke beim gewünschten verfügbaren Exemplar auf **Borrow for 30 days**.
3. Der Server prüft die Anmeldung und die Verfügbarkeit erneut und speichert die Ausleihe.
4. Danach öffnet sich **My loans** mit deinen aktiven Ausleihen, Inventarnummern, Ausleihdaten und Rückgabefristen.

Beide Rollen können für sich selbst ausleihen. Der Benutzer wird aus der geprüften Sitzung gelesen. Ausleihdatum und Frist werden von PostgreSQL gesetzt. Das Formular kann weder einen anderen Benutzer noch eigene Datumswerte vorgeben. Die Frist beträgt vorerst 30 Tage und muss noch mit der Betreuung bestätigt werden.

Jede Ausleihe ist eine neue Zeile in loans. returned_at bleibt leer, solange das Exemplar nicht zurückgegeben wurde. Ein ausgeliehenes Exemplar wird in der Buchansicht als On loan angezeigt und hat keinen Ausleihbutton mehr. Unter /loans sieht jeder standardmässig seine eigenen aktiven Ausleihen und kann zur eigenen Historie wechseln. Andere Benutzer-IDs in der Adresse geben keine fremden Ausleihen frei. Die Seite ist auch über den Link My loans auf der Startseite erreichbar.

Die Speicherung verwendet eine kurze Transaktion. SELECT ... FOR UPDATE sperrt dabei genau die Zeile des Exemplars bis zum Abschluss. Eine zweite gleichzeitige Anfrage muss warten und prüft danach die Verfügbarkeit erneut. Zusätzlich verhindert der vorhandene eindeutige Index zwei aktive Ausleihen desselben Exemplars. Bei einem Fehler wird die neue Änderung zurückgenommen. Bei einer bereits vergebenen oder gelöschten Kopie erscheint eine Fehlermeldung.

Vorhandene Ausleihen und frühere Rückgaben werden durch eine neue Ausleihe nicht überschrieben. Abgeschlossene eigene Ausleihen stehen unter My loans → Loan history.

## Eigene Ausleihen und überfällige Exemplare

Unter **My loans** gibt es drei Ansichten:

- **Active loans**: alle eigenen aktiven Ausleihen, auch die überfälligen.
- **Overdue loans**: nur eigene aktive Ausleihen, deren Rückgabefrist vorbei ist.
- **Loan history**: eigene abgeschlossene Ausleihen mit Ausleihdatum, Frist und Rückgabedatum.

Die Statuswerte heissen **On loan**, **Overdue** und **Returned**. Overdue wird zusätzlich fett angezeigt. Eine bereits zurückgegebene Ausleihe gilt nicht mehr als aktuell überfällig, auch wenn die damalige Frist überschritten war. Für eine leere Ansicht gibt es eine passende Meldung.

In **Administration → Loans and returns** kann die Verwaltung zwischen allen aktiven Ausleihen und **Overdue copies** wechseln. Die überfällige Liste enthält Buch, Inventarnummer, Benutzer, E-Mail und Datumsangaben. Eine Rückgabe kann direkt dort erfasst werden. Nach der Rückgabe verschwindet das Exemplar aus der überfälligen Liste und erscheint in der eigenen Historie des Benutzers.

PostgreSQL prüft bei jedem Aufruf: returned_at ist leer und due_at liegt vor CURRENT_TIMESTAMP. Der Status wird nicht zusätzlich gespeichert. Ein Hintergrunddienst ist dafür nicht nötig. Eine bereits offene Seite muss neu geladen werden, um eine gerade abgelaufene Frist zu sehen.

Alle drei persönlichen Ansichten verwenden die Benutzer-ID aus der geprüften Sitzung. Ein Parameter in der Adresse kann keine fremden Ausleihen freigeben. Nur die Verwaltung darf die Übersicht aller überfälligen Exemplare öffnen. Die Ansichten werden über view in der Adresse gewählt. Unbekannte oder mehrfach angegebene Werte zeigen die aktive Liste.

## Rückgabe erfassen

1. Melde dich als Verwaltung an und öffne **Administration → Loans and returns**.
2. Die Tabelle zeigt alle aktiven Ausleihen mit Buch, Inventarnummer, Name und E-Mail der ausleihenden Person sowie Ausleihdatum und Rückgabefrist.
3. Nachdem du das Exemplar zurückerhalten hast, klicke in der passenden Zeile auf **Record return**.
4. Der Server setzt das aktuelle Rückgabedatum. Die Ausleihe verschwindet aus den aktiven Listen und das Exemplar ist wieder verfügbar, bis es erneut ausgeliehen wird.

Normale Benutzer können keine Rückgabe erfassen, auch nicht über eine direkte Anfrage an die Speicherfunktion. requireAdmin prüft das bei jedem Aufruf auf dem Server. Die Seite /admin/loans ist ebenfalls nur für die Verwaltung erreichbar.

Die Rückgabe ist ein einzelner UPDATE-Befehl: Er setzt returned_at nur dann, wenn dieses Feld noch leer ist. Die Ausleihe bleibt mit ihrer ID, ihrem Benutzer, Exemplar, Ausleihdatum und ihrer Frist gespeichert und ist danach in der eigenen Historie sichtbar. Ein wiederholter oder gleichzeitiger Rückgabeversuch überschreibt das erste Rückgabedatum nicht. Eine alte Rückgabeanfrage kann auch keine spätere neue Ausleihe desselben Exemplars beenden, weil sie nur die ursprüngliche Ausleih-ID verwendet.

Für diesen Schritt sind keine neue Tabelle und kein neues Paket nötig. Ist die Ausleihe bereits abgeschlossen oder nicht mehr vorhanden, erscheint eine kurze Meldung. Nach einer Rückgabe werden die betroffenen Seiten neu eingelesen.

## Bücher und Exemplare verwalten

1. Melde dich mit dem Verwaltungskonto an.
2. Öffne **Administration**, danach **Manage books and copies**.
3. Mit **Add book** erstellst du ein Buch. Titel und Autor sind Pflichtfelder. ISBN, Verlag, Erscheinungsjahr, Kategorie und Beschreibung sind vorerst optional.
4. Nach **Save book** öffnet sich die Bearbeitungsseite. Dort kannst du die Buchangaben ändern.
5. Unter **Add copy** trägst du die Inventarnummer und den Standort eines Exemplars ein. Beide Angaben sind Pflichtfelder.
6. Vorhandene Exemplare stehen beim jeweiligen Buch. Mit **Save copy** speicherst du Änderungen.

Die Übersicht unter /admin/books zeigt die Bücher mit ihrer Anzahl Exemplare. Jedes Exemplar bleibt mit seinem Buch verbunden. Beim Bearbeiten bleiben die IDs erhalten. Es gibt keine Löschfunktion für Bücher, Exemplare oder Ausleihen.

Der Server prüft bei jeder Speicheranfrage die Verwaltungsrolle und die Eingaben. Eine angegebene ISBN muss eine gültige ISBN-10 oder ISBN-13 sein. Leerzeichen und Bindestriche werden vor dem Speichern entfernt. Doppelte ISBNs und Inventarnummern werden mit einer Meldung abgelehnt. Eine leere ISBN wird als NULL gespeichert, damit mehrere Bücher ohne ISBN möglich sind. Die Datenbank schützt eindeutige Werte auch bei gleichzeitigen Anfragen. SQL-Platzhalter trennen die Eingaben vom SQL-Befehl.

Die Textfelder haben einfache Längengrenzen: Titel, Autor und Verlag je 300 Zeichen, Kategorie 100, Beschreibung 5000, Inventarnummer 100 und Standort 200. Die ISBN-Eingabe darf inklusive Leerzeichen und Bindestrichen höchstens 32 Zeichen haben. Das Erscheinungsjahr liegt zwischen 1 und 9999. Diese Regeln werden auch auf dem Server geprüft. Vorhandene Daten werden dadurch nicht automatisch verändert.

## Eingaben und Benutzerrechte

| Funktion | Ohne Anmeldung | Benutzer | Verwaltung |
| --- | --- | --- | --- |
| Loginseite öffnen | Ja | Ja | Ja |
| Bücher suchen und Exemplare ansehen | Nein | Ja | Ja |
| Ein Exemplar für sich ausleihen | Nein | Ja | Ja |
| Eigene Ausleihen, Historie und überfällige Ausleihen ansehen | Nein | Ja | Ja |
| Bücher, Exemplare und Benutzer verwalten | Nein | Nein | Ja |
| Alle aktiven und überfälligen Ausleihen ansehen | Nein | Nein | Ja |
| Eine Rückgabe erfassen | Nein | Nein | Ja |

Die Loginseite leitet bereits angemeldete Personen zur Startseite weiter. Jede geschützte Seite und jede Speicherfunktion prüft die Anmeldung oder Verwaltungsrolle auf dem Server. Ein ausgeblendeter Button allein wäre kein Schutz. Die persönliche Ausleihliste verwendet immer die Benutzer-ID aus der Sitzung. Eingaben aus dem Formular können diese ID nicht ersetzen.

Pflichtfelder, Textlängen, ISBN, Erscheinungsjahr, E-Mail, Passwortlänge, erlaubte Rollen und IDs werden vor dem Speichern geprüft. SQL-Platzhalter trennen Eingaben vom SQL-Befehl. Die Datenbank verhindert doppelte E-Mails, ISBNs und Inventarnummern sowie zwei aktive Ausleihen pro Exemplar. Änderungen an der eigenen Verwaltungsrolle sind gesperrt.

Benutzerangaben werden über das geprüfte Verwaltungsformular geändert. Der ungenutzte Better-Auth-Endpunkt /api/auth/update-user ist gesperrt, damit er diese Prüfung nicht umgehen kann. Login, Logout und die bestehenden Konten funktionieren weiter. Eine öffentliche Registrierung bleibt deaktiviert. Next.js prüft bei Server Actions auch die Herkunft einer Anfrage.

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
| src/app/books/page.tsx | Suchformular und SQL-Abfrage mit Anzahl verfügbarer Exemplare |
| src/app/books/[id]/page.tsx | Buchangaben und Exemplare mit Standort und Verfügbarkeit |
| src/app/books/borrow-button.tsx | Ausleihbutton mit Wartezustand und Fehlermeldung |
| src/app/books/borrow-actions.ts | Prüft Verfügbarkeit und speichert eine Ausleihe mit Frist |
| src/app/loans/page.tsx | Eigene aktive und überfällige Ausleihen sowie Historie mit Rückgabedatum |
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
| src/app/admin/users/ | Benutzerübersicht sowie Formulare zum Anlegen und Bearbeiten |
| src/app/admin/users/actions.ts | Prüft Rechte, erstellt Passwortkonten und speichert Benutzeränderungen |
| src/app/admin/loans/page.tsx | Verwaltungsübersicht mit Filter für überfällige Exemplare |
| src/app/admin/loans/return-button.tsx | Rückgabebutton mit Wartezustand und Fehlermeldung |
| src/app/admin/loans/actions.ts | Prüft Verwaltungsrechte und setzt das Rückgabedatum |
| src/lib/user-forms.ts | Datentyp für sichtbare Benutzerangaben und Prüfung des E-Mail-Formats |
| scripts/setup-db.mjs | Liest die SQL-Dateien und führt sie aus |
| scripts/create-demo-users.mjs | Erstellt fehlende Demo-Benutzer mit Passwort-Hashes |
| database/setup.sql | Erstellt die Grundlage und die Testnachricht |
| database/migrations/001_library_schema.sql | Ergänzt die Bibliothekstabellen |
| database/migrations/002_authentication.sql | Ergänzt die Tabellen für die Anmeldung |
| compose.yaml | Einstellungen für PostgreSQL in Docker |
| docs/projektverlauf.md | Entscheidungen und Notizen für die Präsentation |
| tests/validation.test.mjs | Unit-Tests für IDs, Texte, ISBNs und E-Mail-Adressen |
| tests/app.test.mjs | Browser- und Datenbanktests der wichtigsten Abläufe |
| docs/testprotokoll.md | Testergebnisse und Grenzen der Prüfung |

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

Die neuen Buchfelder sind vorerst optional, damit bisherige Formulare weiter funktionieren. books.borrowed bleibt für den alten Übungscode bestehen. Die aktuelle Verfügbarkeit wird aus copies und aktiven loans berechnet. Das alte Feld books.borrowed wird dafür nicht verwendet.

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

## Automatische Tests

Die Tests liegen jetzt im Repository und können wiederholt gestartet werden. Der eingebaute Testläufer von Node.js führt sie aus. Die älteren Prüfungen im Projektverlauf wurden noch mit lokalen Skripten durchgeführt.

Unit-Tests prüfen einzelne Hilfsfunktionen. Dafür müssen weder Docker noch die Webseite laufen:

```powershell
npm.cmd test
```

Die Browser- und Integrationstests prüfen die laufende App mit PostgreSQL. Dafür müssen Docker, die eingerichtete Datenbank, die Webseite und Google Chrome bereit sein. Der Browser läuft unsichtbar. In einem zweiten Terminal:

```powershell
npm.cmd run test:app
```

BETTER_AUTH_URL und DATABASE_URL kommen aus .env.local. Die Tests akzeptieren nur lokale Adressen. Sie erstellen eigene zufällige Testkonten, Bücher, Exemplare und Ausleihen und entfernen diese anschliessend wieder. Vorhandene Daten werden mit Prüfsummen verglichen. Es werden keine Tabellen zurückgesetzt, Docker-Volumes gelöscht oder vorhandene Passwörter geändert. Während des Tests sollte niemand dieselben Daten auf der Webseite bearbeiten, sonst kann der Vergleich fehlschlagen.

Der Testablauf erzeugt die Daten schrittweise: Buch anlegen, Exemplare hinzufügen, ausleihen und zurückgeben. Die App-Testfälle sind deshalb absichtlich in dieser Reihenfolge ausgeführt. Für einen erneuten Test wieder den ganzen Befehl starten. Bei einem hart abgebrochenen Test können Datensätze mit dem eindeutigen test-Präfix zurückbleiben; ein normal abgeschlossener Test räumt sie auch nach einem fehlgeschlagenen Prüfschritt auf.

Playwright ist nur eine Entwicklungsabhängigkeit für die Browsersteuerung. Es wird keine zusätzliche Testarchitektur in die App eingebaut. Statt Chrome kann ein anderer installierter unterstützter Browser mit TEST_BROWSER_CHANNEL gewählt werden, zum Beispiel msedge. Beim Unit-Test kann Node.js einen Hinweis zur Erkennung von ES-Modulen ausgeben. Dieser Hinweis ist kein fehlgeschlagener Test; die Prüfungen bleiben eingeschaltet.

Die konkreten Ergebnisse stehen in [docs/testprotokoll.md](docs/testprotokoll.md).

## Warum diese Pakete?

- pg verbindet den Server mit PostgreSQL. Ich schreibe SQL direkt und verwende kein ORM.
- @types/pg hilft TypeScript beim Prüfen des Datenbankcodes.
- server-only verhindert, dass Datenbankcode in Browser-Komponenten importiert wird.
- @next/env lädt die Umgebungsdateien für das Setup-Skript.
- better-auth übernimmt Passwort-Hashes, Login, Logout und Sitzungen. Die Bibliothek läuft in der App und verwendet die PostgreSQL-Datenbank.
- ESLint prüft typische Fehler im Code.
- playwright steuert für die App-Tests einen Browser. Das Paket wird im normalen Betrieb nicht benötigt.

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
