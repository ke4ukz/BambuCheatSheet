# Bambu Cheat Sheet

A small SPA for quickly looking up recommended print parameters for a Bambu
printer across filament products, build plates, and nozzles — so you don't have
to dig through four product pages every time. Reference only; not fed to a
printer.

## How it works

Pick a **filament**, **build plate**, and **nozzle** and the app shows the
relevant parameters (temps, adhesion, nozzle requirements, etc.). Each filament
can carry recommendations from multiple **sources** (e.g. Bambu and the filament
maker); when they disagree, both values are shown tagged with their source.
Parameters you don't care about can be hidden via the **Parameters** button
(remembered in your browser).

## Adding filament data

One YAML file per product in `src/data/products/`. Copy
[`docs/product-template.yaml`](docs/product-template.yaml) and fill in what you
have — every field is optional, gaps are fine. Build plate ids live in
`src/data/plates.yaml`; nozzle sizes/types (with an `abrasionResistant` flag
that drives the hardened-nozzle warning) live in `src/data/nozzles.yaml`; the
parameters shown (and their grouping/units) live in `src/data/parameters.yaml`.

## Develop

```bash
npm install
npm run dev
```

## Deploy

Pushing to `main` builds and publishes to GitHub Pages via
`.github/workflows/deploy.yml`. Enable Pages once under **Settings → Pages →
Source: GitHub Actions**. The site serves from the custom domain
**bambucheatsheet.ke4ukz.com** (via `public/CNAME`), so the Vite base is `/`. In
GitHub set **Settings → Pages → Custom domain** to that host, and add a DNS
`CNAME` record for `bambucheatsheet` → `<user>.github.io`. If you drop the custom
domain, set `base` back to `/BambuCheatSheet/` in `vite.config.js`.
