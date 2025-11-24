Architekturentscheidungen & Designprinzipien – DualNet

1. Wichtige Designprinzipien für DualNet
	1.	Modularität / Separation of Concerns
	•	Backend, Frontend, Datenhaltung klar getrennt.
	•	Jede Funktion (User Management, Beiträge, Chat) als eigener Service oder Modul implementiert.
	•	Unterstützt Wartbarkeit und Austauschbarkeit (Q3).
	2.	Sicherheit first
	•	Passwörter werden gehasht gespeichert (z. B. bcrypt).
	•	Schutz vor unautorisiertem Zugriff auf Nutzerdaten (Q1).
	3.	Benutzerfreundlichkeit (Usability)
	•	Klare Fehlermeldungen bei Login oder Interaktionen (Q2).
	•	Schnelle Reaktionen bei Interaktionen, z. B. Login unter 1 Sekunde (Q4).
	4.	Skalierbarkeit und Performance
	•	MongoDB als Datenbank, um wachsende Nutzerzahlen effizient zu handhaben.
	•	Asynchrone Verarbeitung für Benachrichtigungen oder Chat-Nachrichten möglich.
	5.	Zuverlässigkeit & Konsistenz
	•	Eindeutige Nutzer-Accounts (Email/Username) verhindern Duplikate (Q5).
	•	Sicherstellen, dass Daten konsistent gespeichert werden, auch bei hoher Last.
	6.	Entkopplung und Wartbarkeit
	•	Repository-Pattern für Datenzugriff, einfache Austauschbarkeit der Datenquelle (z. B. später von account.txt → MongoDB).
	•	Unterstützt schnelle Änderungen ohne große Refaktorierungen.
