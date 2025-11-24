# ADR: Wahl des Architekturstils – Layered + Modular Services
Datum: 24.11.2025
Status: Accepted

## Kontext
DualNet benötigt eine Webanwendung mit mehreren Funktionalitäten (User Management, Beiträge, Chat). Hohe Priorität haben Sicherheit, Wartbarkeit und Zuverlässigkeit (Q1, Q3, Q5).

## Entscheidung
Wir verwenden ein **modulares Layered-Architekturkonzept**:
- Frontend (HTML, JavaScript)
- Backend (Java, Spring Boot)
- Persistenz (MongoDB)  
  Jede Funktion (User, Post, Chat) ist als eigenes Modul gekapselt.

## Begründung
- Trennung der Verantwortlichkeiten erleichtert Wartung und Weiterentwicklung.
- Modularität erlaubt spätere Erweiterungen ohne Beeinträchtigung anderer Module.
- Unterstützt priorisierte Qualitätsszenarien: Wartbarkeit (Q3), Zuverlässigkeit (Q5).

## Alternativen
- Monolith ohne klare Trennung: einfacher, aber schlechter wartbar.
- Voll Microservices: Overkill für kleines Team, erhöht Komplexität.

## Konsequenzen
+ Einfache Wartbarkeit und Erweiterbarkeit
+ Unterstützung für zukünftige Skalierung  
  – Initialer Aufwand für Modularisierung
