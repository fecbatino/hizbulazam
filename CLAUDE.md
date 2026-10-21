# Hizbul Azam — Projektkontext für Coding-Agenten

Diese Datei ist die **einzige** Quelle für Projektregeln. `AGENTS.md` verweist nur hierher.

## Was die App ist

PWA mit den Duas des Hizbul Azam (arabischer Text, Transkription, Übersetzung in
Deutsch/Englisch/Französisch), Dark Mode, Offline-Betrieb, Favoriten.
Keine Accounts, kein Backend, keine Nutzerdaten.

- Stack: React 19 · Vite 6 · TypeScript strict · Tailwind (Build) · `vite-plugin-pwa`
- Repo: `fecbatino/hizbulazam` (public), Default-Branch `main`
- Lokaler Checkout (Windows): `Documents/Dev/hizbulazam`
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
npm run test          # vitest (18 Tests)
npm run preview       # dist/ lokal ansehen
```

Vor jedem Commit müssen `typecheck`, `lint`, `test` und `build` grün sein.

## Deployment

```
Push auf main ──► GitHub Actions
   Job "Prüfen":  npm ci → typecheck → lint → test → build
   Job "Ausliefern" (environment: production, needs: verify)
      rsync dist/ → root@159.69.204.155:/opt/stacks/hizbulazam/dist/
      docker compose up -d
   Smoke-Test: / · /manifest.webmanifest · /data/collections.json == 200
```

- Der Container `hizbulazam` (nginx:1.27-alpine) hängt im externen Netz `web-network`,
  hat **keinen Host-Port**; nginx-proxy-manager (Host 22) zeigt auf `hizbulazam:80`.
- `deploy/nginx.conf`: `/assets/*` und `/fonts/*` immutable, `/data/*` 5 Minuten,
  `index.html`/`sw.js`/Manifest `no-cache`, SPA-Fallback.
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
- Keine Secrets im Repo. `.env` existiert nicht und wird nicht angelegt.
- Neue Dependencies nur mit Begründung im Commit.
- Bundle-Größe ist ein Feature: `dist/assets/index-*.js` bleibt unter 40 kB (aktuell ~26 kB);
  Daten gehören nach `public/data/`, nicht ins Bundle.
- `dist/` wird nie committet. `public/data/*.json` **wird** committet.

## Bekannte offene Punkte

| Punkt | Datei | Status |
|---|---|---|
| UI-Strings teils englisch, teils deutsch | `App.tsx`, `components/*` | offen |
| `metadata.json` ohne Funktion | Root | offen |
| Keine Tests für Tageswechsel/Swipe | `hooks/useSwipe.ts` | offen |

## Arbeitsweise

1. Erst lesen und belegen (Datei:Zeile), dann ändern.
2. Nach jeder Änderung die Akzeptanzkommandos ausführen und die Ausgabe zeigen.
3. Nichts behaupten, was nicht ausgeführt wurde.
4. Am Ende: `git diff --stat`, kurze Zusammenfassung, offene Risiken.
