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

## Fehler und Hinweise

Weitere Prüfungen bestanden: npm run lint, npm run typecheck und npm run build. npm audit --omit=dev meldete keine bekannten Schwachstellen in den Produktionspaketen. Die bekannte Warnung in den Entwicklungswerkzeugen blieb bestehen; es wurde kein automatischer Versionswechsel erzwungen.

In den getesteten Abläufen wurde kein weiterer Funktionsfehler der App gefunden. Im Testcode wurde das Warten auf einen gespeicherten Standort verbessert: Der Test wartet auf die Serverantwort, bevor er die Seite neu lädt. So wird ein gerade laufender Speichervorgang nicht versehentlich durch den Test unterbrochen.

Node.js kann beim Importieren der TypeScript-Hilfsfunktionen einen Hinweis zur Erkennung von ES-Modulen ausgeben. Die Unit-Tests bestehen trotzdem. Dafür wurde keine Prüfung deaktiviert und die Moduleinstellung der Anwendung nicht geändert.

## Grenzen und offene Punkte

- Die Tests decken die wichtigsten Abläufe und ausgewählte Fehlerfälle ab. Sie beweisen nicht, dass jeder mögliche Fehler ausgeschlossen ist.
- Die vorgeschlagene Ausleihfrist von 30 Tagen muss noch bestätigt werden.
- Eine komplette Installation auf einem neuen Rechner und ein Neustart von Docker wurden in diesem Durchlauf nicht getestet.
- Die Browser-Tests liefen gegen den Entwicklungsserver. Ein Browserdurchlauf gegen einen gestarteten Produktionsbuild ist nicht Teil dieses Ergebnisses.
- Für die App-Tests wird ein installiertes Google Chrome verwendet. Die Adressen der App und Datenbank müssen lokal sein.
- Die bekannte Warnung in den ESLint-Entwicklungsabhängigkeiten wird in der README erklärt.

Für die Präsentation:

"Es gibt Unit-Tests für einzelne Prüfungen und Browser-Tests für die wichtigsten Abläufe. Die Browser-Tests legen eigene Daten an und prüfen zum Beispiel Ausleihe, Rückgabe, Benutzerrechte und zwei gleichzeitige Anfragen. Danach werden die Testdaten wieder entfernt."
