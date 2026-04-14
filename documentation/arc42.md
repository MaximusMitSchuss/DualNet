---
date: April 2026
title: "DualNet - arc42 Architekturdokumentation"
---

# 1. Einführung und Ziele

DualNet ist eine einfache Social-Media-Plattform, die speziell für dual Studierende der DHBW konzipiert wurde. Ziel des Projekts ist es, einen kleinen, gut verständlichen Prototypen zu bauen, in dem sich Studierende anmelden, registrieren und miteinander in Kontakt treten können.

## 1.1 Aufgabenstellung
Bereitstellung einer Plattform mit Authentifizierung, Nutzerprofilen, Beiträgen, Interaktionen und Messaging. Fokus auf einfache, datenschutzorientierte Grundstruktur.

## 1.2 Qualitätsziele
* **Q1: Sicherheit first:** Passwörter werden gehasht (z.B. BCrypt) gespeichert; Schutz vor unautorisiertem Zugriff.
* **Q2: Benutzerfreundlichkeit (Usability):** Klare Fehlermeldungen (z.B. bei Login) und intuitives UI.
* **Q3: Modularität / Separation of Concerns (Wartbarkeit):** Klare Trennung von Backend, Frontend und Datenhaltung. Jede Funktion als eigenes Modul.
* **Q4: Skalierbarkeit und Performance:** Schnelle Reaktionen bei Interaktionen (z.B. Login < 1 Sekunde).
* **Q5: Zuverlässigkeit & Konsistenz:** Eindeutige Nutzer-Accounts (E-Mail/Username) zur Vermeidung von Duplikaten.

## 1.3 Stakeholder
| Rolle | Erwartung |
| :--- | :--- |
| Duale Studierende (DHBW) | Einfache Registrierung, Vernetzung und Kommunikation. |
| Entwicklerteam | Gut wartbare, modulare und erweiterbare Code-Basis. |

# 2. Randbedingungen

## 2.1 Technische Randbedingungen
* **Programmiersprache:** Java
* **Framework:** Spring Boot, Build-Tool: Maven
* **Frontend:** HTML, JavaScript (React/Vue als Option für die Zukunft, aktuell Vanilla JS mit Fetch-API für Komponenten wie `navbar.html`).
* **Datenablage:** Initial als einfache Textdatei (`data/accounts.txt` im CSV-Format), später Migration zu MongoDB.
* **Entwicklungsumgebung:** WebStorm / IntelliJ IDEA.
* **Deployment:** Lokale Ausführung über eingebetteten Tomcat-Server (`localhost:8085`).

# 3. Kontextabgrenzung

Das System "DualNet" steht im Zentrum der Kommunikation der DHBW-Studierenden. 
Es interagiert primär mit den Endbenutzern (Studierende und Administratoren) über eine Weboberfläche.

# 4. Lösungsstrategie

Um die Qualitätsziele Q3 und Q5 zu erreichen, verwenden wir ein **modulares Layered-Architekturkonzept**.
Die Anwendung ist getrennt in Frontend (Webansichten), Backend-Logik (REST-Controller, Services) und Persistenz (Repository-Pattern). 
Das Repository-Pattern erlaubt den transparenten Austausch der initialen Datei-basierten Speicherung durch eine MongoDB.

# 5. Bausteinsicht

Die Anwendung ist in fachliche Module unterteilt (z.B. User Management, Feed/Beiträge, Chat). 

## 5.1 Whitebox DualNet Gesamtsystem
* **Frontend-Komponenten:** Statische Ressourcen (`src/main/resources/static`). HTML-Seiten und JS-Logik.
* **Backend-Controller:** Nehmen REST-Anfragen vom Frontend entgegen.
* **Services:** Enthalten die Geschäftslogik (Prüfung von Duplikaten, Hashing).
* **Repositories:** Kapseln den Zugriff auf `data/accounts.txt`.

![UML-Klassendiagramm](documentation/UML-Klassen-Diagramm.png)

# 6. Laufzeitsicht

Die Kommunikation zwischen Frontend und Backend erfolgt über **RESTful APIs**. 
Ablauf einer Registrierung/Anmeldung:
1. Client sendet Login-Daten via HTTP POST.
2. Controller leitet an Service weiter.
3. Service prüft Daten über Repository.
4. Bei Erfolg wird eine Session erstellt und das Profil geladen.

![Sequenzdiagramm](../../IdeaProjects/DualNet/documentation/Sequenzdiagramm.png)
![Aktivitätsdiagramm Login/Registrierung](../../IdeaProjects/DualNet/documentation/Login-Anwendungsdiagramm.png)

# 7. Verteilungssicht

DualNet ist eine klassische Client-Server-Anwendung:
* **Client-Knoten:** Web-Browser des Nutzers, lädt statische UI-Komponenten (inkl. wiederverwendbarer `navbar.html`).
* **Server-Knoten:** Lokaler Rechner (Entwicklung), der die Java Spring Boot Anwendung (Applikationsserver auf Port 8085) ausführt.
* **Daten-Knoten:** Lokales Dateisystem (`data/accounts.txt`) innerhalb des Projektverzeichnisses, welches durch das Java-Backend gelesen/geschrieben wird.

# 8. Querschnittliche Konzepte

* **Sicherheitskonzept:** Passwörter werden nie im Klartext gespeichert (gehasht). 
* **UI-Komposition:** Wiederkehrende HTML-Teile (wie die Navigation) werden als separate Dateien angelegt und clientseitig über die Fetch-API in den DOM geladen.
* **Event-driven Architektur (intern):** Die Module im Backend sollen perspektivisch event-basiert (z.B. über das Observer-Pattern) kommunizieren, um die lose Kopplung zu stärken.
* **Persistenzkapselung:** Die Speicherung erfolgt aktuell in `.txt`-Dateien mit CSV-ähnlichen Strukturen. Durch das verwendete Repository-Pattern hat dies keine Auswirkungen auf die Service-Schicht.

# 9. Architekturentscheidungen

Die folgenden Architecture Decision Records (ADRs) aus dem letzten Semester sind maßgeblich:

1. **ADR 1 - Architekturstil Layered und Modular Services:** 
   Wahl einer modularen Schichtenarchitektur (Frontend, Backend, Persistenz). Begründung: Einfache Wartbarkeit (Q3) und Vorbereitung auf Skalierung.
2. **ADR 2 - Kommunikation und Interaktion:** 
   Frontend ↔ Backend via REST. Backend-Module untereinander perspektivisch Event-driven (Observer-Pattern) für maximale Entkopplung und Fehlertoleranz.
3. **ADR 3 - Persistenzstrategie:** 
   Initial Textdatei-Mock; das finale Ziel ist MongoDB pro Modul. Die NoSQL-Datenbank bietet Flexibilität für dynamische Inhalte wie Posts und Kommentare.

# 10. Qualitätsanforderungen

## 10.1 Qualitätsbaum (Utility Tree)
![Utility Tree](../../IdeaProjects/DualNet/documentation/UtilityTree.png)

## 10.2 Qualitätsszenarien
* **Performance:** Das Login-Szenario wird unter Normalbedingungen in weniger als einer Sekunde abgeschlossen (Q4).
* **Zuverlässigkeit:** Bei der Registrierung wird asynchron geprüft, ob Username oder E-Mail bereits vergeben sind, um Inkonsistenzen (Duplicate Accounts) abzufangen (Q5).
* **Wartbarkeit:** Der Austausch der Datenspeicherung (von `accounts.txt` auf `MongoDB`) erfordert ausschließlich Änderungen auf Repository-Ebene, Service und Controller bleiben unberührt.

# 11. Risiken und technische Schulden
*(Wird im Laufe des Semesters bearbeitet)*

# 12. Glossar
*(Wird im Laufe des Semesters bearbeitet)*
