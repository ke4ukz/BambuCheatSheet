# Development

Vue 3 + Vite single-page app. Filament data lives in YAML files that are bundled
at build time — there is no backend.

## Run locally

```bash
npm install
npm run dev
```

## Adding / editing filament data

One YAML file per product in `src/data/products/`. Copy
[`product-template.yaml`](product-template.yaml) and fill in what you have —
every field is optional and gaps are expected, **but every recorded value must
cite a source `url`** (the validator errors otherwise; no link = no information).

Supporting definitions:

- Build plate ids — `src/data/plates.yaml`
- Nozzle sizes / types (with the `abrasionResistant` flag) — `src/data/nozzles.yaml`
- Parameters shown, grouping, units, show/hide defaults — `src/data/parameters.yaml`

Conventions: an **absent** field = unknown (renders `—`); an explicit
`false` / `{required: false}` = an affirmative "no requirement" (renders "Not
required" / "Not compatible"). When sources disagree, add multiple entries to a
product's `sources:` list and the app shows each value tagged with its source.

## Validate

```bash
npm run validate   # also runs automatically on `prebuild`
```

## Deploy

Pushing to `main` builds and publishes to GitHub Pages via
`.github/workflows/deploy.yml`. The site serves from the custom domain
**bambucheatsheet.ke4ukz.com** (via `public/CNAME`), so the Vite `base` is `/`.
If the custom domain is dropped, set `base` back to `/BambuCheatSheet/` in
`vite.config.js`.
