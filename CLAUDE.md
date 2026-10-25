# Hizbul Azam — Projektkontext für Coding-Agenten

Diese Datei ist die **einzige** Quelle für Projektregeln. `AGENTS.md` verweist nur hierher.

## Was die App ist

PWA mit den Duas des Hizbul Azam (arabischer Text, Transkription, Übersetzung in
Deutsch/Englisch/Französisch), Dark Mode, Offline-Betrieb, Favoriten.
Keine Accounts, kein Backend, keine Nutzerdaten.

- Stack: React 19 · Vite 6 · TypeScript strict · Tailwind 4 (Build) · `vite-plugin-pwa`
- Repo: `fecbatino/hizbulazam` (public), Default-Branch `main`
- Lokaler Checkout (Windows): `Documents/ChatGPT/Dev/hza-analysis`
- Produktion: https://hza.fechal-batakpale.com

## Architektur in Kurzform

```
public/data/collections.json     Index der 7 Tage (Namen, Dua-IDs) - klein, sofort geladen
public/data/day-<tag>.json       Duas eines Tages, alle Sprachen (~23-34 kB)
public/data/search-index.json    Suchindex aller 140 Duas (~147 kB, nur bei Suche geladen)
public/fonts/*.woff2             selbst gehostete Schriften (arabic + latin)
hooks/useCollections.ts          Loader + Modul-Cache für Tagesdaten
hooks/useDeepLink.ts             #/day/<tag> und #/dua/<id>, Hash-Navigation
lib/normalize.ts                 Suchnormalisierung (arabische Diakritika, Alef-Formen)
lib/language.ts                  Startsprache ohne gespeicherte Wahl: Gerätesprachen, dann
                                 Land (Locale-Region, Zeitzone), sonst Deutsch; nur eine
                                 ausdrückliche Auswahl wird gespeichert (hzaLanguage)
lib/hidden.ts                    Ausgeblendete Duas (einzeln/nach Quelle, hzaHiddenDuas);
                                 bleiben als schmale Zeile mit Anker im Tag, Favoriten zeigen alles
components/SearchModal.tsx       Suche, lädt den Index erst beim Öffnen
components/ErrorBoundary.tsx     fängt Renderfehler, verhindert weiße Seite
```

Die Duas liegen **nicht** mehr im JS-Bundle. Wer Inhalte ändert, bearbeitet die JSON-Dateien
in `public/data/` oder erzeugt sie neu:

```
python3 scripts/split-data.mjs.py    # aus hooks/duas.ts (Altbestand) -> public/data/*.json
```

## Befehle

```
npm ci                # exakt nach package-lock
npm run dev           # Vite Dev-Server, Port 3000
npm run build         # Produktionsbuild -> dist/
npm run typecheck     # tsc --noEmit
npm run lint          # eslint
npm run test          # Vitest (Unit- und Inhaltstests)
npm run test:e2e      # Playwright gegen dist/ (vorher build)
npm run preview       # dist/ lokal ansehen
```

Vor jedem Commit müssen `typecheck`, `lint`, `test` und `build` grün sein.

## Deployment

```
Push auf main ──► GitHub Actions
   Job "Prüfen":  npm ci → typecheck → lint → test → build
   Job "Ausliefern" (environment: production, needs: verify)
      deploy/sync-stack.sh → Server-Checkout per Fast-Forward auf <commit>,
         nginx -t in Wegwerf-Container, compose up --wait, nginx reload
      Artefakt → /opt/stacks/hizbulazam/releases/<commit>/
      deploy/publish.sh → /var/www/hza (Assets zuerst, Einstiegspunkte atomar),
         danach Bereinigung: letzte 5 Releases behalten; Dateien unter assets/ nur löschen,
         wenn kein behaltenes Release sie enthält UND sie älter als 30 Tage sind.
         Steuerung: HZA_KEEP_RELEASES (≥2), HZA_ASSET_MAX_AGE_DAYS (≥7),
         HZA_RETENTION_DRY_RUN=1 (nur anzeigen). Geprüft in CI per deploy/test-publish.sh.
   Smoke-Test: / · /manifest.webmanifest · /assets/content/<version>/collections.json == 200,
               deployed-sha.txt == Commit, Content-Security-Policy vorhanden
```

- Der Container `hizbulazam` (nginx 1.30.6-alpine, per Digest gepinnt) hängt im externen
  Netz `web-network`, hat **keinen Host-Port**; nginx-proxy-manager (Host 22) zeigt auf
  `hizbulazam:80`. Gehärtet: `read_only`, tmpfs für Cache/PID/Temp, `no-new-privileges`,
  `cap_drop: ALL` plus CHOWN/SETUID/SETGID/NET_BIND_SERVICE.
- `deploy/nginx/default.conf`: `/assets/*` immutable, `index.html`/`sw.js`/Manifest
  `no-cache`, SPA-Fallback. `/data/*` und `/fonts/*` nur noch für ältere geöffnete Versionen;
  der Build liefert sie nicht mehr aus. Das Verzeichnis `deploy/nginx/` wird eingebunden
  (kein Einzeldatei-Mount), damit Git-Updates im Container ankommen.
- `deploy/nginx/security-headers.inc`: CSP (nur `'self'`), nosniff, Referrer-, Permissions-
  und Opener-Policy. Jede `location` mit eigenem `add_header` muss die Datei einbinden.
  HSTS setzt der TLS-Endpunkt.
- Webroot ist `/var/www/hza` (Default in `docker-compose.yml`); eine `.env` im Stack ist
  optional. Lokal: `HZA_ROOT=./dist docker compose up`.
- Compose-/nginx-Änderungen kommen per CI an. Der Server-Checkout darf keine lokalen
  Änderungen an versionierten Dateien haben, sonst bricht der Fast-Forward ab.
- Secrets: `SSH_KEY`, `HOST`, `PORT`, `USERNAME`; optional `SSH_KNOWN_HOSTS`. Der Deploy-User
  braucht Docker-Rechte und Schreibrechte auf `/opt/stacks/hizbulazam`.
- Host-Schlüssel: `PIN` im Workflow ist der **ed25519**-Fingerprint des Servers
  (`ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub`). `deploy/pin-host-key.sh` nimmt aus dem
  Secret (CRLF wird entfernt) bzw. per `ssh-keyscan -t ed25519` nur die ed25519-Einträge für
  `HOST` (Port 22: nackter Host, sonst `[HOST]:PORT`; Einträge anderer Hosts werden ignoriert),
  verlangt, dass **jeder** davon dem Pin entspricht, und beschränkt ssh nur für `HOST` per
  `HostKeyAlgorithms ssh-ed25519` / `StrictHostKeyChecking yes`. Der Job „Host-Schlüssel prüfen“
  läuft nur in PRs, nur lesend, und scannt mit `SCAN_SERVER=1` immer auch den Server.
  Neuer Server-Schlüssel → `PIN` und Secret ändern.
- Rollback: NPM-Host 22 zurück auf `hza-web:80` (der alte Container und `/var/www/hza`
  bleiben bestehen), oder `dist/` aus dem vorherigen Artefakt zurückspielen.

**Jeder Push auf `main` deployt.** Deshalb: nie direkt auf `main` arbeiten, immer Branch + PR.
Branch-Namen: `claude/<thema>-<YYYYMMDD>` bzw. `codex/<thema>-<YYYYMMDD>`.

## Inhaltliche Regeln (Arabisch)

- Arabische Texte sind **Quellmaterial**, keine Code-Strings. Keine Korrektur von
  Diakritika, keine Normalisierung, keine „Verbesserung" der Übersetzung.
- Fehlt eine Dua oder wirkt sie falsch: melden, nicht selbst ergänzen.
- `dir="rtl"` und `lang="ar"` gehören an den arabischen Textblock (siehe `DuaCard`),
  nicht an das Dokument. Dokument-Sprache folgt der UI-Sprache (`App.tsx`).
- Keine religiösen Aussagen erfinden, keine Quellenangaben hinzudichten.

## Technische Regeln

- Keine externen CDNs oder Fremd-Origins im Produktionsbuild. Prüfen mit:
  `grep -E 'https?://' dist/index.html` (muss leer sein).
- Keine Secrets im Repo. Im Repo gibt es keine `.env` (nur optional im Server-Stack, ignoriert).
- Neue Dependencies nur mit Begründung im Commit.
- Bundle-Größe ist ein Feature: `dist/assets/index-*.js` bleibt unter 40 kB (aktuell ~26 kB);
  Daten gehören nach `public/data/`, nicht ins Bundle.
- `dist/` wird nie committet. `public/data/*.json` **wird** committet.

## Bekannte offene Punkte

| Punkt | Datei | Status |
|---|---|---|
| Arabische UI-Sprache entfernt (kein `source_context_ar`, kein RTL-Layout); gespeichertes `ar` fällt auf Deutsch zurück. Wiederaufnahme erst mit geprüften arabischen Quellenkontexten | `types.ts` (`Language` vs. `NameLanguage`) | entschieden |
| Bereinigung alter Releases/Assets auf dem Server | `deploy/publish.sh`, Test `deploy/test-publish.sh` | umgesetzt, freigegeben am 22.10.2026 |
| Tageswechsel/Scrollen | `e2e/reading.spec.ts` | Regressionstests; Tageswechsel nur ausdrücklich |

## Arbeitsweise

1. Erst lesen und belegen (Datei:Zeile), dann ändern.
2. Nach jeder Änderung die Akzeptanzkommandos ausführen und die Ausgabe zeigen.
3. Nichts behaupten, was nicht ausgeführt wurde.
4. Am Ende: `git diff --stat`, kurze Zusammenfassung, offene Risiken.
