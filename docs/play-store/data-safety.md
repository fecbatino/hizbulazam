# Data Safety — Antworten für die Play Console

Grundlage: Die App erhebt nichts. Keine Konten, keine Analyse, keine Werbung,
keine Drittanbieter-SDKs, keine Netzwerkziele außer dem eigenen Server
(im Browser gegen die Produktion geprüft: 0 externe Hosts beim Laden).

## Abschnitt „Datenerfassung und -weitergabe"

| Frage | Antwort |
|---|---|
| Erhebt oder teilt die App erforderliche Nutzerdaten? | **Nein** |
| Sind alle erhobenen Daten verschlüsselt übertragen? | entfällt (keine Erhebung) |
| Können Nutzer die Löschung ihrer Daten verlangen? | entfällt (keine Erhebung) |

Damit ist der Rest des Formulars leer — keine Datenkategorien auswählen.

## Abschnitt „Sicherheitspraktiken"

| Frage | Antwort |
|---|---|
| Daten werden verschlüsselt übertragen | ja (HTTPS, HSTS-fähig) — nur relevant, falls doch Daten anfallen |
| Nutzer können Daten löschen | entfällt |
| Unabhängige Sicherheitsprüfung | nein |
| Familienrichtlinie | nein (App richtet sich nicht an Kinder) |

## Wichtig für die Begründung

Lokale Speicherung (localStorage: Favoriten, Einstellungen, Leseposition;
Cache Storage: Offline-Inhalte) gilt **nicht** als Erhebung, weil die Daten das
Gerät nicht verlassen und für den Entwickler nicht zugänglich sind. Das ist
auch die Linie der Datenschutzerklärung (`/datenschutz.html`).

Server-Zugriffsprotokolle (IP, Zeitstempel) sind technisch notwendig für den
Betrieb und werden nicht ausgewertet; sie werden im Formular nicht als
„Erhebung" angegeben, sind aber in der Datenschutzerklärung offengelegt.
