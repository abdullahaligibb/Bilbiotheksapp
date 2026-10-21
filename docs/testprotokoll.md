# Testprotokoll

Datum: 21.10.2026

Die Tests liegen im Ordner tests. Sie werden mit dem Testläufer von Node.js gestartet. Jeder Testfall enthält mehrere einzelne Prüfungen. Die früher genannten Zahlen im Projektverlauf zählten einzelne Prüfbedingungen aus temporären Skripten und sind deshalb nicht direkt mit diesen Testfallzahlen vergleichbar.

## Unit-Tests

Befehl: npm.cmd test

Ergebnis: 11 von 11 Testfällen bestanden.

- Gültige Datenbank-IDs werden angenommen, ungültige abgelehnt.
- Texte werden am Anfang und Ende von Leerzeichen befreit.
- Fehlende Felder und Dateien werden nicht als Text behandelt.
- ISBN-10 und ISBN-13 werden mit ihrer Prüfziffer geprüft.
- Falsche ISBN-Prüfziffern, Längen und Formate werden abgelehnt.
- Gängige gültige E-Mail-Adressen funktionieren.
- Ungültige Punkte, Domains, fehlende Teile und zu lange E-Mail-Adressen werden abgelehnt.

## Browser- und Integrationstests

Befehl: npm.cmd run test:app

Ergebnis: 13 von 13 Testfällen bestanden.

| Testfall | Ergebnis |
| --- | --- |
| Beide Rollen melden sich über das echte Loginformular an | Bestanden |
| Gäste und normale Benutzer werden von Verwaltungsseiten ausgeschlossen | Bestanden |
| Bücher anlegen und bearbeiten; ungültige und doppelte ISBNs ablehnen | Bestanden |
| Exemplare anlegen und bearbeiten; doppelte Inventarnummern ablehnen | Bestanden |
| Suche nach Titel, Autor und formatierter ISBN; Verfügbarkeit anzeigen | Bestanden |
| Benutzer anlegen und bearbeiten; E-Mail, Passwort-Hash und Rollen prüfen | Bestanden |
| Verwaltungsrechte auch bei direkten Speicheranfragen prüfen | Bestanden |
| Ausleihe speichert den angemeldeten Benutzer und eine Frist von 30 Tagen | Bestanden |
| Nur die Verwaltung erfasst die Rückgabe; ursprüngliche Daten bleiben erhalten | Bestanden |
| Zwei gleichzeitige Ausleihanfragen erhalten dasselbe Exemplar nicht doppelt | Bestanden |
| Überfällige Ausleihen und eigene Historie werden nach einer Rückgabe aktualisiert | Bestanden |
| Datenbank lehnt doppelte aktive Ausleihen und ungültige Datumswerte ab | Bestanden |
| Veränderte oder abgelaufene Sitzungen und alte Cookies nach der Abmeldung werden abgelehnt | Bestanden |

Die Tests verwenden nur eigens angelegte Konten und Datensätze. Diese werden danach entfernt. Es wurden keine bestehenden Konten oder Passwörter überschrieben und keine Datenbanken oder Docker-Volumes zurückgesetzt. Prüfsummen der bestehenden Daten blieben gleich. Die Browser meldeten keine JavaScript-Fehler. Rollenwechsel beendeten die bisherigen Sitzungen. Der Versuch, sich die eigene Verwaltungsrolle zu entfernen, wurde abgelehnt.

## Neustarttest: Daten bleiben erhalten

Datum: 21.10.2026. Ergebnis: Bestanden.

Geprüft wurde der Git-Stand ff6886c mit der vorhandenen lokalen Datenbank. Vor dem Test waren drei Bücher, sechs Exemplare, zwei Benutzer und keine Ausleihen vorhanden. Damit auch Ausleihen geprüft werden konnten, wurden ein eigenes Testkonto, ein Testbuch und zwei Testexemplare ergänzt. Ein Exemplar wurde über den Browser ausgeliehen. Für das zweite wurde eine bereits abgeschlossene Ausleihe als Testdatensatz angelegt.

| Schritt | Ergebnis |
| --- | --- |
| Daten vor dem Stoppen erfassen | Vier Bücher, acht Exemplare, drei Benutzer und zwei Ausleihen gespeichert |
| Next.js stoppen und docker compose down ausführen | App und PostgreSQL gestoppt; kein Volume gelöscht |
| docker compose up -d --wait ausführen und Next.js wieder starten | PostgreSQL gesund und App erreichbar |
| Anzahl und Prüfsummen der gespeicherten Zeilen vergleichen | books, copies, users, loans, setup_check, auth_accounts und auth_verifications unverändert |
| Bestehende Testsitzung im Browser verwenden | Weiterhin angemeldet; Datenbanknachricht sichtbar |
| Aktive Ausleihe und Historie öffnen | Beide Ausleihen mit ihren gespeicherten Daten vorhanden |
| Verfügbarkeit ansehen | Aktives Exemplar ausgeliehen, zurückgegebenes Exemplar verfügbar |
| Erneut anmelden | Anmeldung mit dem Testkonto weiterhin möglich |
| Eigene Neustart-Testdaten entfernen | Ursprüngliche Bücher, Exemplare, Benutzer und Ausleihen unverändert |

Das PostgreSQL-Volume bibliotheksapp_postgres_data wurde vor und nach dem Test geprüft. Es war dasselbe Volume mit demselben Erstellungsdatum. Der Container wurde neu erstellt und las die vorhandenen Daten daraus. Während des Tests wurden weder die Einrichtungsskripte im Original erneut ausgeführt noch vorhandene Zugangsdaten geändert.

Login-Sitzungen wurden getrennt geprüft: Eine weitere Anmeldung erzeugte während der Prüfung eine zusätzliche Sitzung. Deshalb wurde für auth_sessions keine unveränderte Gesamtzahl vorausgesetzt. Stattdessen wurde die vor dem Neustart gespeicherte Testsitzung im Browser geprüft. Fremde Sitzungen blieben bei der Bereinigung erhalten. In den geprüften Browserabläufen gab es keine JavaScript-Fehler.

## Frische Einrichtung nach README

Datum: 21.10.2026. Ergebnis: Bestanden.

Die Prüfung verwendete eine saubere Kopie der eingecheckten Dateien von ff6886c in einem getrennten temporären Ordner. node_modules, .next, .env und .env.local aus der Arbeitskopie wurden nicht übernommen. Für Docker wurde ein eigenes, neu angelegtes Volume fresh_postgres_data verwendet. Das Original war währenddessen gestoppt, damit die Standardports 3000 und 5432 frei waren.

| Schritt aus der README | Ergebnis |
| --- | --- |
| npm.cmd ci | 442 Pakete aus package-lock.json installiert |
| Beispieldateien als .env und .env.local übernehmen und Platzhalter ersetzen | Neue, unabhängige lokale Passwörter und ein zufälliges Auth-Secret eingerichtet |
| docker compose up -d --wait | Leere PostgreSQL-Datenbank im eigenen Volume gestartet |
| npm.cmd run db:setup | Tabellen und Verbindungsnachricht angelegt |
| npm.cmd run demo:users | Zwei Demo-Konten mit unterschiedlichen Rollen angelegt |
| npm.cmd run demo:books | Drei Bücher und sechs Exemplare angelegt |
| npm.cmd run dev | App unter localhost:3000 gestartet |
| Beide Demo-Konten über das Loginformular anmelden | Anmeldung, Verbindungsnachricht und Rollenschutz funktionieren |
| Katalog öffnen | Alle drei Bücher mit jeweils zwei verfügbaren Exemplaren sichtbar |
| npm.cmd test und npm.cmd run test:app | 11 Unit-Tests und 13 Browser- und Integrationstestfälle bestanden |
| npm.cmd run lint, npm.cmd run typecheck und npm.cmd run build | Alle drei Prüfungen bestanden |
| Fertigen Build mit next start starten und im Browser prüfen | Beide Logins, Datenbanknachricht, Katalog und Rollenschutz funktionieren |

Für die Einrichtung waren keine Änderungen am Anwendungscode oder an der Startanleitung nötig. Anschliessend wurden die getrennte Test-App und ihr Datenbankcontainer gestoppt und das Original wieder gestartet. Das Test-Volume wurde nicht gelöscht. Die Testdatenbank ist keine Voraussetzung für das Originalprojekt.

Die Installation meldete weiterhin fünf hohe npm-audit-Einträge sowie einen Hinweis zur nicht mehr unterstützten ESLint-Version 9.39.5. Es wurde kein automatischer Paketwechsel durchgeführt. Beim automatischen Browserlauf schrieb der Entwicklungsserver Meldungen zu einem geschlossenen Stream (CLOSED writable stream). Alle Testfälle bestanden und die Browser meldeten keine pageerror-Ereignisse. Beim anschliessenden Browser-Kurztest mit dem Produktionsbuild blieb die Server-Fehlerausgabe leer. Die Ursache der Stream-Meldungen wurde nicht abschliessend geklärt.

## Fehler und Hinweise

Weitere Prüfungen bestanden: npm run lint, npm run typecheck und npm run build. npm audit --omit=dev meldete keine bekannten Schwachstellen in den Produktionspaketen. Die bekannte Warnung in den Entwicklungswerkzeugen blieb bestehen; es wurde kein automatischer Versionswechsel erzwungen.

In den getesteten Abläufen wurde kein weiterer Funktionsfehler der App gefunden. Im Testcode wurde das Warten auf einen gespeicherten Standort verbessert: Der Test wartet auf die Serverantwort, bevor er die Seite neu lädt. So wird ein gerade laufender Speichervorgang nicht versehentlich durch den Test unterbrochen.

Node.js kann beim Importieren der TypeScript-Hilfsfunktionen einen Hinweis zur Erkennung von ES-Modulen ausgeben. Die Unit-Tests bestehen trotzdem. Dafür wurde keine Prüfung deaktiviert und die Moduleinstellung der Anwendung nicht geändert.

## Grenzen und offene Punkte

Zusätzliche Prüfung der Übergabedaten am 21.10.2026: Drei fiktive Bücher mit jeweils zwei Exemplaren wurden angelegt. Ein zweiter Aufruf des Skripts erzeugte keine Duplikate und veränderte keine bestehenden Zeilen. Die vollständigen Buchangaben, gültigen ISBN-Prüfziffern und eindeutigen Inventarnummern wurden geprüft. Alle Bücher und ihre verfügbaren Exemplare waren im Browser sichtbar. Lint und TypeScript bestanden auch nach dieser Ergänzung.

- Die Tests decken die wichtigsten Abläufe und ausgewählte Fehlerfälle ab. Sie beweisen nicht, dass jeder mögliche Fehler ausgeschlossen ist.
- Die vorgeschlagene Ausleihfrist von 30 Tagen muss noch bestätigt werden.
- Die frische Einrichtung wurde auf demselben Windows-Rechner mit bereits installiertem Node.js, Docker Desktop und Chrome geprüft. Die Installation dieser Werkzeuge auf einem anderen Rechner ist damit nicht getestet.
- Der Neustarttest prüfte Next.js und den PostgreSQL-Container, einschliesslich Neuerstellung des Containers mit bestehendem Volume. Windows und Docker Desktop selbst wurden nicht neu gestartet.
- Die 13 App-Testfälle liefen gegen den Entwicklungsserver. Gegen den Produktionsbuild wurden Anmeldung, Datenbanknachricht, Katalog und Rollenschutz als Browser-Kurztest geprüft; nicht die gesamte Testsuite.
- Für die App-Tests wird ein installiertes Google Chrome verwendet. Die Adressen der App und Datenbank müssen lokal sein.
- Die bekannte Warnung in den ESLint-Entwicklungsabhängigkeiten wird in der README erklärt.

Für die Präsentation:

"Es gibt Unit-Tests für einzelne Prüfungen und Browser-Tests für die wichtigsten Abläufe. Die Browser-Tests legen eigene Daten an und prüfen zum Beispiel Ausleihe, Rückgabe, Benutzerrechte und zwei gleichzeitige Anfragen. Danach werden die Testdaten wieder entfernt."
