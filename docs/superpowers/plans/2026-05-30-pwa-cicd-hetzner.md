# PWA + CI/CD + Hetzner Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-deploy Hizbulazam to `https://hza.fechal-batakpale.com` on every push to `main`, with proper PWA PNG icons for install prompts.

**Architecture:** GitHub Actions builds `dist/` in CI, rsyncs it to `/var/www/hza/` on the Hetzner server. Host Nginx (already installed) serves the static files. PWA icons are generated from `public/icon.svg` using `sharp` and committed as PNGs.

**Tech Stack:** Vite + vite-plugin-pwa, sharp (icon generation), GitHub Actions, rsync over SSH, Nginx

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `scripts/generate-icons.cjs` | CREATE | Rasterizes `icon.svg` → `icon-192.png` + `icon-512.png` |
| `public/icon-192.png` | CREATE (generated) | 192×192 PNG for PWA install prompt |
| `public/icon-512.png` | CREATE (generated) | 512×512 PNG for PWA splash screen |
| `package.json` | MODIFY | Add `sharp` as devDependency |
| `vite.config.ts` | MODIFY | Add PNG icons to manifest `icons` array + `includeAssets` |
| `nginx.conf` | CREATE | Server config (committed to repo as operator reference) |
| `.github/workflows/deploy.yml` | MODIFY | Complete rewrite: CI build + rsync deploy |

---

## Task 1: Generate PWA PNG Icons

**Files:**
- Create: `scripts/generate-icons.cjs`
- Create: `public/icon-192.png` (generated output, committed)
- Create: `public/icon-512.png` (generated output, committed)
- Modify: `package.json`
- Modify: `vite.config.ts`

- [ ] **Step 1: Add `sharp` as devDependency**

Run from repo root (same directory as `package.json`):

```bash
npm install --save-dev sharp
```

Expected: `package.json` now contains `"sharp": "^0.34.x"` in `devDependencies`. `package-lock.json` updated.

- [ ] **Step 2: Create icon generation script**

Create `scripts/generate-icons.cjs` with this exact content:

```javascript
const sharp = require('sharp');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'public', 'icon.svg');

async function generate() {
  const sizes = [192, 512];
  for (const size of sizes) {
    const outPath = path.join(__dirname, '..', 'public', `icon-${size}.png`);
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Generated: icon-${size}.png`);
  }
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 3: Run the script**

```bash
node scripts/generate-icons.cjs
```

Expected output:
```
Generated: icon-192.png
Generated: icon-512.png
```

- [ ] **Step 4: Verify output files exist and have correct size**

```bash
ls -lh public/icon-192.png public/icon-512.png
```

Expected: both files exist, `icon-192.png` ~10–50 KB, `icon-512.png` ~50–200 KB. If either is 0 bytes or missing, the sharp conversion failed — check that `public/icon.svg` exists.

- [ ] **Step 5: Update `vite.config.ts` — extend `includeAssets` and `manifest.icons`**

In `vite.config.ts`, replace the `VitePWA(...)` plugin config section as follows:

Change `includeAssets` from:
```typescript
includeAssets: ['icon.svg'],
```
To:
```typescript
includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
```

Replace the `icons` array in `manifest` from:
```typescript
icons: [
  {
    src: 'icon.svg',
    sizes: '512x512',
    type: 'image/svg+xml',
    purpose: 'any'
  },
  {
    src: 'icon.svg',
    sizes: '512x512',
    type: 'image/svg+xml',
    purpose: 'maskable'
  }
]
```
With:
```typescript
icons: [
  {
    src: 'icon-192.png',
    sizes: '192x192',
    type: 'image/png',
    purpose: 'any'
  },
  {
    src: 'icon-512.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'any'
  },
  {
    src: 'icon-512.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'maskable'
  },
  {
    src: 'icon.svg',
    sizes: '512x512',
    type: 'image/svg+xml',
    purpose: 'any'
  }
]
```

- [ ] **Step 6: Verify build succeeds with new config**

```bash
npm run build
```

Expected: build completes without errors. Check `dist/` contains `icon-192.png`, `icon-512.png`, and `manifest.webmanifest`. Verify manifest has PNG icons:

```bash
cat dist/manifest.webmanifest
```

Expected JSON includes entries for `icon-192.png` and `icon-512.png`.

- [ ] **Step 7: Commit**

```bash
git add scripts/generate-icons.cjs public/icon-192.png public/icon-512.png package.json package-lock.json vite.config.ts
git commit -m "feat: add PNG icons for PWA install prompt and update manifest"
```

---

## Task 2: Server Nginx Config

**Files:**
- Create: `nginx.conf`

- [ ] **Step 1: Create `nginx.conf` in repo root**

Create the file at repo root with this exact content:

```nginx
# Nginx config for hza.fechal-batakpale.com
# Deploy to: /etc/nginx/sites-available/hza.fechal-batakpale.com
# Enable:    ln -s /etc/nginx/sites-available/hza.fechal-batakpale.com /etc/nginx/sites-enabled/
# Reload:    nginx -t && nginx -s reload
# HTTPS:     certbot --nginx -d hza.fechal-batakpale.com

server {
    listen 80;
    server_name hza.fechal-batakpale.com;

    root /var/www/hza;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;

    # Long-lived cache for versioned static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service worker must never be cached
    location = /sw.js {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        expires 0;
    }

    # SPA fallback: all routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add nginx.conf
git commit -m "feat: add nginx config for hza.fechal-batakpale.com"
```

---

## Task 3: GitHub Actions CI Build + rsync Deploy

**Files:**
- Modify: `.github/workflows/deploy.yml` (complete rewrite)

- [ ] **Step 1: Replace `.github/workflows/deploy.yml` entirely**

Replace the full file content with:

```yaml
name: Deploy to Hetzner

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_KEY }}" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          ssh-keyscan -p ${{ secrets.PORT }} -H ${{ secrets.HOST }} >> ~/.ssh/known_hosts

      - name: Deploy via rsync
        run: |
          rsync -avz --delete \
            -e "ssh -p ${{ secrets.PORT }}" \
            dist/ \
            ${{ secrets.USERNAME }}@${{ secrets.HOST }}:/var/www/hza/
```

- [ ] **Step 2: Commit and push to main**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: replace deploy workflow with CI build + rsync to Hetzner"
git push origin main
```

- [ ] **Step 3: Verify GitHub Actions run succeeds**

1. Go to `https://github.com/fecbatino/hizbulazam/actions`
2. Find the workflow run triggered by the push
3. Confirm all steps pass — especially "Build" and "Deploy via rsync"
4. If "Deploy via rsync" fails with `Permission denied`, check that the SSH public key for `secrets.SSH_KEY` is in `/root/.ssh/authorized_keys` (or the appropriate user's `authorized_keys`) on the Hetzner server

Expected final step output includes lines like:
```
sending incremental file list
./
index.html
assets/
sw.js
manifest.webmanifest
sent X bytes  received Y bytes
```

---

## Manual Server Setup (operator runs once before first deploy)

These steps are run **directly on the Hetzner server** via SSH. They are not automated by GitHub Actions.

```bash
# 1. Create web root
mkdir -p /var/www/hza

# 2. Copy nginx config from repo (run from repo clone, or paste inline)
cp nginx.conf /etc/nginx/sites-available/hza.fechal-batakpale.com

# 3. Enable site
ln -s /etc/nginx/sites-available/hza.fechal-batakpale.com /etc/nginx/sites-enabled/hza.fechal-batakpale.com

# 4. Test config and reload
nginx -t && nginx -s reload

# 5. Issue Let's Encrypt certificate (requires DNS to already point to server)
certbot --nginx -d hza.fechal-batakpale.com
```

After Step 5, Certbot automatically modifies the nginx config to add HTTPS (port 443) and HTTP→HTTPS redirect.

**Verification:** After the first GitHub Actions deploy completes, visit `https://hza.fechal-batakpale.com` — app should load. Open browser DevTools → Application → Manifest to confirm PWA icons appear correctly.
