# ADR: Persistenzstrategie – MongoDB pro Modul
Datum: 24.11.2025
Status: Accepted

## Kontext
Jedes Modul benötigt eigene Datenhaltung, um unabhängig weiterentwickelt werden zu können. Priorisierte Qualitätsszenarien: Wartbarkeit (Q3) und Zuverlässigkeit (Q5).

## Entscheidung
- MongoDB als Datenbank
- Jeder Modul hat ggf. eigene Collection (User, Post, Chat)
- Repository-Pattern für Datenzugriff, um später leichter Datenquellen zu ändern

## Begründung
- NoSQL-Datenbank flexibel für dynamische Inhalte wie Posts, Kommentare, Likes
- Unterstützt schnelle Änderungen der Datenstruktur
- Eindeutige Nutzeraccounts verhindern Duplikate (Q5)

## Alternativen
- Relationale Datenbank (MySQL/PostgreSQL): starrere Struktur, weniger flexibel für dynamische Inhalte

## Konsequenzen
+ Flexible Datenhaltung, schnelle Anpassungen möglich
+ Unterstützt hohe Zuverlässigkeit  
  – Zusätzliche Logik bei komplexen Queries über mehrere Collections
