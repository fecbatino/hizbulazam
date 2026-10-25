# Play-Console-Spickzettel — Hizbul Azam

Stand 23.10.2026 · Paket `com.fechalbatakpale.hizbulazam` · versionCode 2

## A) Store-Texte

**App-Name (max. 30)** — 11 Zeichen
```
Hizbul Azam
```

**Kurzbeschreibung (max. 80)** — 62 Zeichen
```
Die Duas der Woche, arabisch mit Übersetzung — offline lesbar.
```

**Vollständige Beschreibung (max. 4000)** — 1.585 Zeichen

```
Hizbul Azam versammelt die Duas der Woche — von Freitag bis Donnerstag, insgesamt
140 Bittgebete — in arabischer Schrift mit deutscher Übersetzung.

Die Sammlung folgt dem traditionellen Aufbau: Für jeden Wochentag gibt es eine
festgelegte Folge von Duas, beginnend mit der Basmala und der Fatiha. Jede Dua
steht als eigene Karte mit arabischem Originaltext, Übersetzung und — wo
vorhanden — der Angabe zur Überlieferung.

FUNKTIONEN

• Sieben Wochentage mit je 19 bis 21 Duas, insgesamt 140
• Arabischer Originaltext mit vollständigen Diakritika, rechtsläufig gesetzt
• Deutsche Übersetzung unter jedem Text
• Suche über alle 140 Duas — arabisch, deutsch oder französisch, auch ohne
  Diakritika („barmherzig" findet „Barmherzigen")
• Favoriten für die Duas, die man immer wieder braucht
• Deep-Links: jede Dua hat eine eigene Adresse und lässt sich teilen
• Offline-Modus: die ganze Woche auf einmal herunterladen und ohne Netz lesen
• Einstellbare Schriftgrößen für arabischen Text und Übersetzung
• Heller und dunkler Modus, folgt auf Wunsch dem System
• Keine Werbung, keine Konten, keine Datenerhebung

WOFÜR DIE APP GEDACHT IST

Zum Nachlesen und Mitlesen: morgens vor der Arbeit, abends zu Hause, in der
Moschee oder unterwegs. Wer eine Dua auswendig lernt, kann die Schriftgröße
vergrößern und die Übersetzung ausblenden.

ZU DEN TEXTEN

Der arabische Text wird unverändert wiedergegeben. Die Übersetzung dient dem
Verständnis und ersetzt keine fachliche oder religionsrechtliche Beratung.

DATENSCHUTZ

Die App erhebt keine personenbezogenen Daten, enthält keine Werbung und keine
Analyse-Dienste und stellt keine Verbindungen zu Servern Dritter her.
Datenschutzerklärung: https://hza.fechal-batakpale.com/datenschutz.html
```

## B) Grafiken

| Asset | Datei | Maße | Größe |
|---|---|---|---|
| App-Icon | `public/icon-512.png` | 512×512 | 31,9 KB |
| Feature-Grafik | `docs/play-store/feature-graphic-1024x500.png` | 1024×500 | 207,9 KB |
| Screenshot 1 | `docs/play-store/screenshots/01-tagesansicht.png` | 1080×1920 | 210,4 KB |
| Screenshot 2 | `docs/play-store/screenshots/02-dua-arabisch.png` | 1080×1920 | 206,5 KB |
| Screenshot 3 | `docs/play-store/screenshots/03-suche-leer.png` | 1080×1920 | 256,4 KB |
| Screenshot 4 | `docs/play-store/screenshots/04-suche-treffer.png` | 1080×1920 | 277,6 KB |
| Screenshot 5 | `docs/play-store/screenshots/05-tagesauswahl.png` | 1080×1920 | 229,3 KB |
| Screenshot 6 | `docs/play-store/screenshots/06-einstellungen.png` | 1080×1920 | 194,5 KB |

Alle Anforderungen erfüllt: Icon ≤ 1 MB und 512×512, Feature-Grafik 1024×500,
Screenshots zwischen 320 und 3840 px im Verhältnis 9:16.

## C) URLs

```
Datenschutz  https://hza.fechal-batakpale.com/datenschutz.html   200 text/html 4589 B
Impressum    https://hza.fechal-batakpale.com/impressum.html     200 text/html 1987 B
Website      https://hza.fechal-batakpale.com/                   200
Kontakt      fecbatino@gmail.com
```

## D) Formular-Antworten

### IARC / Alterseinstufung

Kategorie: **Nachschlagewerk, Nachrichten oder Bildung**

| Frage | Antwort |
|---|---|
| Gewalt, Angst, Sexualität, Sprache, Drogen | nein |
| Glücksspiel (echt oder simuliert) | nein |
| Käufe / In-App-Käufe | nein |
| Werbung | nein |
| Nutzerinteraktion (Chat, Kommentare, Profile) | nein |
| Standortweitergabe | nein |
| Weitergabe personenbezogener Daten | nein |
| Unmoderierte Inhalte von Nutzern | nein |

Erwartet: **USK 0 / PEGI 3**, alle Altersgruppen.

### Data Safety

| Frage | Antwort |
|---|---|
| Erhebt oder teilt die App Nutzerdaten? | **Nein** |
| Datenkategorien auswählen | keine |
| Verschlüsselte Übertragung | entfällt (keine Erhebung) |
| Löschung durch Nutzer möglich | entfällt |
| Unabhängige Sicherheitsprüfung | nein |
| Familienrichtlinie | nein |

Begründung für Rückfragen: localStorage (Favoriten, Einstellungen, Leseposition)
und Cache Storage (Offline-Inhalte) verlassen das Gerät nicht und sind für den
Betreiber nicht einsehbar — das gilt nicht als Erhebung.

## Offene Punkte vor Produktion

- Impressum/Datenschutz: Platzhalter `[Straße und Hausnummer]` und `[PLZ]` füllen.
- Zielgruppe 13+ wählen, nicht „Kinder" (sonst Families-Policy).
