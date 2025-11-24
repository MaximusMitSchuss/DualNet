# ADR: Kommunikation im System – RESTful + Event-driven
Datum: 24.11.2025
Status: Accepted

## Kontext
Frontend und Backend müssen effizient kommunizieren, außerdem müssen verschiedene Module (Post, Chat) Daten austauschen. Qualitätsszenarien: Performance (Q4) und Zuverlässigkeit (Q5).

## Entscheidung
- **Frontend ↔ Backend:** RESTful APIs
- **Backend Module ↔ Module:** Event-driven (z. B. Observer Pattern für Benachrichtigungen)

## Begründung
- REST ist standardisiert, einfach zu implementieren, gut für CRUD-Operationen (Posts, Likes, Kommentare).
- Event-driven Kommunikation erlaubt Entkopplung zwischen Modulen, erhöht Fehlertoleranz und Zuverlässigkeit.

## Alternativen
- Direkte Datenbankzugriffe zwischen Modulen: reduziert Entkopplung, höhere Kopplung
- gRPC: besser für Performance, aber komplexer

## Konsequenzen
+ Entkoppelte Module → einfache Wartung
+ REST ist einfach testbar  
  – Event-System benötigt zusätzliche Logik