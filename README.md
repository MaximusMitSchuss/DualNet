# DualNet - Softwareengeneering - Projekt

## Team -
#### Johannes (Produkt Owner)
#### Ali (Dev Team)
#### Max (Scrum Master)
#### Sebastiano (Dev Team)

## Planung -
##### Mittwoch:     Retroperspektive von erstellten Features für kommende Sprints & Kommentieren von Blogs anderer Gruppen
##### Donnerstag:   Features in Issues umwandeln & dem Team zuordnen -> Zugewiesene Aufgaben ausführen
##### Freitag:      Aufgaben ausführen
##### Samstag:      Aufgaben ausführen
##### Sonntag:      Aufgaben ausführen
##### Montag:       Aufgaben ausführen und aufkommende Probleme lösen oder in die nächsten Sprints aufnehmen
##### Dienstag:     Nächster Sprint mit Features definieren und Blog erstellen

## Projektspezifische Informationen

DualNet ist eine einfache Social‑Media‑Plattform, die speziell für dual Studierende der DHBW konzipiert wurde. Ziel des Projekts ist es, einen kleinen, gut verständlichen Prototypen zu bauen, in dem sich Studierende anmelden, registrieren und miteinander in Kontakt treten können.

Kurze Übersicht
- Zielgruppe: Dual Studierende der DHBW.
- Beschreibung: Web-Anwendung mit Benutzerregistrierung und Login. Benutzer können sich per Benutzername oder E‑Mail anmelden.

Technologien
- Programmiersprache: Java
- Framework: Spring Boot (Maven als Build-Tool)
- Projektstruktur: klassische Maven-Ordnerstruktur (Quellcode in `src/main/java`, statische Ressourcen in `src/main/resources/static`).

Datenablage
- Die Benutzerdaten werden in einer einfachen Textdatei im Projektverzeichnis abgelegt: `data/accounts.txt`.
- Das Format ist CSV-ähnlich (username,email,password) mit einfachen Escape-Regeln.

Wichtige Hinweise
- Login: Benutzer können sich mit entweder dem Benutzernamen oder der E‑Mail sowie dem Passwort anmelden.
- Registrierung: Neue Accounts werden in `data/accounts.txt` gespeichert; es wird geprüft, ob Benutzername oder E‑Mail bereits existieren.
- Wiederverwendbare UI-Teile (z. B. die Navigationsleiste) sind als statische Fragmentdatei (`src/main/resources/static/navbar.html`) angelegt und werden in den Seiten per Fetch geladen.

Schnellstart
1. Projekt bauen und starten (unter macOS / Linux):

   ./mvnw spring-boot:run

2. Anwendung im Browser öffnen: http://localhost:8080/ (oder direkt `/Homepage.html`, `/login.html`, `/registration.html`)

Weiteres
- Diese README ist bewusst kompakt gehalten. Für tiefergehende Dokumentation (z. B. API, Sicherheitsverbesserungen, Tests) können weitere Sektionen ergänzt werden.
