# AGENTS.md

Eine Regelquelle: [`CLAUDE.md`](./CLAUDE.md). Lies sie vollständig, bevor du eine Datei änderst.

## Zusätzlich für Codex

- Branch `codex/<thema>-<YYYYMMDD>`; **kein Push auf `main`** (deployt sofort nach Produktion).
- Akzeptanz vor jedem Commit: `npm run typecheck && npm run lint && npm run test && npm run build`.
- Datenänderungen nur in `public/data/*.json`; das Bundle bleibt bei ~26 kB.
- Keine Secrets lesen oder schreiben, `.env` gibt es hier nicht.
