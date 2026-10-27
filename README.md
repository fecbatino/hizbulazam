# Hizbul Azam

PWA für die tägliche Lektüre des Hizbul Azam: arabische Texte, Übersetzungen in Deutsch, Englisch und Französisch, Quellenangaben, Suche und lokale Favoriten.

## Lesen und Navigation

- Tage ausdrücklich über die Pfeile oder die Tagesauswahl wechseln. Scrollen und native Zoomgesten wechseln keinen Tag.
- Die letzte sichtbare Dua und ihre Position werden pro Tag auf dem Gerät gespeichert, auch beim Wechsel zu Favoriten oder nach einem Neustart.
- Die Tagesauswahl bietet „Tagesanfang“, um bewusst von vorne zu lesen.
- Arabische Schriftgröße und Übersetzungsgröße sind in den Einstellungen unabhängig wählbar.
- Sprache, Favoriten, Schriftgrößen und Farbschema bleiben lokal gespeichert.
- Dialoge sperren den Seitenhintergrund, behalten den Tastaturfokus und stellen ihn beim Schließen wieder her.

## Offline und Updates

In den Einstellungen kann die gesamte Woche einschließlich Suche und Schriften heruntergeladen werden. Erst nach erfolgreicher Prüfung aller Dateien erscheint die Bestätigung. Unterbrochene Downloads können wiederholt werden. Browser dürfen gespeicherte Daten bei Speicherknappheit entfernen; der Status wird beim Öffnen erneut geprüft.

Tagesdaten und Schriften liegen im Build unter versionsgebundenen URLs in `assets/content/<revision>/`. Eine ältere offene App verwendet dadurch weiterhin die zu ihr passenden Daten. Neue Inhalte werden zusammen mit einem App-Update veröffentlicht.

Die App zeigt verfügbare Updates an. „Jetzt aktualisieren“ sichert die Leseposition vor dem Neuladen; „Später“ lässt die aktuelle Lesesitzung weiterlaufen.

## Entwicklung

Node.js 22.12+ (22 LTS), 24 LTS oder 26+; npm.

```bash
npm ci
npm run dev           # http://localhost:3000
npm run typecheck
npm run lint
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:production # Docker: echtes Nginx, HTTP-Verträge, alle Build-Dateien, Browser
npm run preview
```

React 19, TypeScript, Vite, Tailwind 4 als PostCSS-Build, Workbox/PWA, Vitest und Playwright. Alle Schriften werden selbst gehostet. Keine Anmeldung, kein Anwendungsbackend, keine externen CDNs.

## Auffindbarkeit für Agenten

Die Startseite enthält eine ohne JavaScript lesbare Einführung, Canonical-/Open-Graph-Metadaten
und JSON-LD für die App und ihren im Impressum genannten individuellen Betreiber.
Nginx liefert für `/`, `/index.html`, `/about` und `/contact` je nach `Accept` HTML oder Markdown,
mit `Vary: Accept`. Qualitätswerte und Wildcards werden berücksichtigt; ohne akzeptable
Darstellung kommt 406. `/privacy` liefert die bestehende mehrsprachige Datenschutzerklärung.
Unbekannte Pfade liefern 404 mit einem zur Präferenz passenden HTML-/Markdown-Fehlertext.
App-Links bleiben Fragmente (`/#/day/...`, `/#/dua/...`).
Die PWA speichert dafür eine beim Build erzeugte feste HTML-Kopie unter `/offline.html`
(nicht indexierbar); die verhandelnde Startseite wird nicht als HTML vorgemerkt.

`/llms.txt` beschreibt Einsatzfälle und Abrufwege, `/robots.txt` verweist auf `/sitemap.xml`.
Bei Inhaltsänderungen die tatsächlichen Änderungsdaten der betroffenen Sitemap-Einträge
pflegen. Die Markdown-Fassungen der Einführung, Über-uns- und Kontaktseite gemeinsam
mit den HTML-Fassungen aktualisieren. Nginx-Maps werden mit
`node scripts/generate-negotiation.mjs` erzeugt und durch einen Reproduzierbarkeitstest geprüft.

`npm run test:production` verwendet das in Compose gepinnte Nginx-Image und prüft alle
Build-Dateien bytegenau über HTTP sowie die App in Smartphone- und Desktop-Größe.
Nach einer Veröffentlichung kann `node scripts/check-agent-http.mjs https://hza.fechal-batakpale.com`
die öffentlichen HTTP-Verträge erneut prüfen. Dafür werden die Entwicklungsabhängigkeiten benötigt.

Die Datenquellen liegen weiterhin in `public/data/*.json`. Arabischer Text, Übersetzungen und Quellen dürfen im Rahmen technischer oder gestalterischer Arbeiten nicht verändert werden. Siehe [CLAUDE.md](./CLAUDE.md).

Neue UI-Texte sind in `lib/ui.ts` gebündelt. Die Dialoge verwenden `hooks/useFocusTrap.ts`; die Leseposition wird über `hooks/useReadingPosition.ts` verwaltet.

Icons nach einer SVG-Änderung erzeugen:

```bash
node scripts/generate-icons.cjs
```

## Prüfungen

CI prüft Pull Requests und `main`: Typen, ESLint einschließlich React-Hooks-Regeln, Unit-/Inhaltstests, Build und Browserprüfungen in Smartphone- und Desktop-Größe.

Die Browserprüfungen decken diagonale Gesten, Dialog-Scrollsperre, Fokus nach Schriftgrößenänderungen, Tagesnavigation, Favoriten, Neustart, Sprachwahl, wiederholte Suchtreffer und die Offline-Woche ab. Touch-Ereignisse sind simuliert; zusätzliche Abnahme auf echten iOS-/Android-Geräten bleibt sinnvoll.

## Auslieferung

Nur der erfolgreiche Workflow auf `main` oder ein manueller Lauf auf `main` darf ausliefern; der Job nutzt das GitHub-Environment `production`. Arbeit erfolgt auf Branch und Pull Request, niemals direkter Push auf `main`.

Der laufende Container `hizbulazam` bindet **`/var/www/hza`** schreibgeschützt als Webroot ein. Projekt und Konfiguration liegen in `/opt/stacks/hizbulazam`. Ein Container-Neustart ist für statische Dateien nicht erforderlich.

CI überträgt das vollständige Artefakt zuerst nach `/opt/stacks/hizbulazam/releases/<commit>`. `deploy/publish.sh` veröffentlicht alle Ressourcen vor den Einstiegspunkten und ersetzt `index.html` sowie `sw.js` jeweils per atomarem Umbenennen. Es gibt keinen Löschabgleich auf dem aktiven Webroot: ältere gehashte Assets bleiben für offene Sitzungen verfügbar.

Die Veröffentlichung des gesamten Dateibaums ist kein einzelner atomarer Verzeichniswechsel. Die Reihenfolge verhindert fehlende neue Abhängigkeiten; alte Clients behalten ihre Ressourcen. Der Smoke-Test kontrolliert Startseite, Manifest, Datenindex und ausgelieferte Commit-ID.

Rollback eines auf dem Server vorhandenen Artefakts:

```bash
bash /opt/stacks/hizbulazam/deploy/publish.sh <vollständiger-vorheriger-commit>
```

Release-Verzeichnisse und ältere Assets werden absichtlich nicht automatisch gelöscht. Ihre spätere Aufbewahrung muss die Anforderungen offener und länger offline genutzter Clients berücksichtigen.
