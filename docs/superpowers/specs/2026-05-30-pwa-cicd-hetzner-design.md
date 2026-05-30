# Design: PWA + CI/CD + Hetzner Deploy + Subdomain

**Date:** 2026-05-30  
**Status:** Approved  
**Target URL:** https://hza.fechal-batakpale.com

## Overview

Complete the deployment pipeline for Hizbulazam so every push to `main` automatically builds and deploys to the Hetzner server, served under `hza.fechal-batakpale.com` with HTTPS. Also improve PWA icon coverage with proper PNG assets.

## Context

- PWA is already configured via `vite-plugin-pwa` in `vite.config.ts` — no changes needed there
- GitHub remote: `https://github.com/fecbatino/hizbulazam.git`
- GitHub secrets already set: `HOST`, `USERNAME`, `PORT`, `SSH_KEY`
- DNS: `hza.fechal-batakpale.com` A-record already points to Hetzner server IP
- Server: Nginx on host level (no Docker)
- Current deploy.yml problem: builds on server but never serves the output

## Architecture

```
GitHub push to main
  → GitHub Actions
      → npm ci + npm run build (produces dist/)
      → rsync dist/ → server:/var/www/hza/
  → Nginx on Hetzner
      → serves /var/www/hza/ for hza.fechal-batakpale.com
      → HTTPS via Certbot (Let's Encrypt)
  → PWA service worker
      → caches all static assets + Google Fonts offline
```

## Components

### 1. GitHub Actions Workflow (`.github/workflows/deploy.yml`)

Replaces the existing workflow entirely.

**Steps:**
1. `actions/checkout@v4`
2. `actions/setup-node@v4` with Node 20 and npm cache
3. `npm ci`
4. `npm run build`
5. SSH key setup from `secrets.SSH_KEY` into `~/.ssh/id_rsa`
6. `ssh-keyscan -p $PORT` to populate `known_hosts` from `secrets.HOST`
7. `rsync -avz --delete -e "ssh -p $PORT" dist/ $USERNAME@$HOST:/var/www/hza/`

Uses existing secrets (`HOST`, `USERNAME`, `PORT`, `SSH_KEY`) — no new secrets needed.

### 2. Server Nginx Configuration (`nginx.conf` in repo root)

Stored in repo as documentation. Deployed manually once by the operator.

**Server path:** `/etc/nginx/sites-available/hza.fechal-batakpale.com`

**Key config:**
- `root /var/www/hza;` — serves built dist output
- SPA fallback: `try_files $uri $uri/ /index.html;`
- Long-lived cache for JS/CSS/assets: `expires 1y; Cache-Control: public, immutable`
- No-cache for service worker: `sw.js` gets `no-store, no-cache, must-revalidate`
- Gzip enabled for text types
- Certbot adds HTTPS block automatically

**One-time server setup (manual, not automated):**
```bash
mkdir -p /var/www/hza
cp nginx.conf /etc/nginx/sites-available/hza.fechal-batakpale.com
ln -s /etc/nginx/sites-available/hza.fechal-batakpale.com /etc/nginx/sites-enabled/
nginx -t && nginx -s reload
certbot --nginx -d hza.fechal-batakpale.com
```

### 3. PWA PNG Icons (`scripts/generate-icons.cjs`)

Generate 192×192 and 512×512 PNG icons from `public/icon.svg` using `sharp`.

**Output:**
- `public/icon-192.png`
- `public/icon-512.png`

**`vite.config.ts` manifest update:**
Add both PNGs to the `icons` array with correct `sizes` and `purpose` values. SVG entries remain as fallback.

**`scripts/generate-icons.cjs`:** Node script using `sharp` (latest stable, e.g. `^0.34`) to rasterize the SVG at 192×192 and 512×512. Run once locally, commit the output PNGs. `sharp` added as devDependency.

## Data Flow

```
Local push
  → GitHub Actions runner
      → build output: dist/ (index.html, assets/, sw.js, manifest.webmanifest)
  → rsync → /var/www/hza/ on server
  → browser requests hza.fechal-batakpale.com
      → Nginx serves /var/www/hza/index.html
      → React app boots, service worker registers
      → SW caches JS/CSS/fonts for offline use
```

## Error Handling

- rsync failure: GitHub Actions step fails, deploy stops, no partial state (rsync is atomic per file)
- Build failure: deploy step never reached
- Nginx reload needed: only on first setup — ongoing deploys just replace files in `/var/www/hza/`
- PWA update: `registerType: 'autoUpdate'` in vite-plugin-pwa ensures clients get new SW on next visit

## What Does NOT Change

- `vite.config.ts` PWA config (Workbox, manifest base, runtime caching) — only icons array extended
- `package.json` dependencies — only `sharp` added as devDependency
- All application code

## Out of Scope

- Docker (not needed for static site with host Nginx)
- Server-side rendering
- CDN / asset distribution
- Multiple environments / staging

## Manual Steps Required After Implementation

The operator must run these on the Hetzner server once before the first deploy can succeed:

```bash
mkdir -p /var/www/hza
# copy nginx.conf from repo to server
certbot --nginx -d hza.fechal-batakpale.com
```

The GitHub Actions job will then handle all future deploys automatically.
