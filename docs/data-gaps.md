# Data gaps & manual to-do

Status as of the overnight data expansion. The catalog now has **126 products**
(Bambu 44, Polymaker 44, SUNLU 11, Overture 11, eSun 10, Hatchbox 6). Validator
passes (every value is backed by a source link).

---

## Follow-ups from the guide-mining session (2026-06-07) — DISCUSS

Mined the wiki general material table into `src/data/material-guide.yaml` and built
four Guides-hub guides (Drying, AMS, Nozzle, Build plate). Things that came up:

1. **HIGH — glues.yaml PC/PA "inference" is now an explicit Bambu fact.** The wiki
   table states, verbatim: PC → Liquid Glue **"Not Recommended"** (glue stick
   100-120 °C); PA → Liquid Glue **"Not Recommended"** (glue stick 90-110 °C). Our
   `glues.yaml` still frames liquid-glue's PC/PA omission as an *inference, "not a
   Bambu claim."* It now IS a Bambu claim. **Action:** upgrade that note from
   inference → cited fact, adding the wiki material-table URL as the source. (Left
   for you to OK since we worded the inference deliberately.)

2. **MEDIUM — the off-store products can now get a *type-level* AMS answer.** The
   wiki AMS table is keyed by material type, so the products with no store page
   (pla-lite/-dynamic/-silk/-tough, tpu-95a, support-w) can be filled as *general
   by-type guidance*: PLA → AMS Available (so the 4 off-store PLAs = true);
   TPU (generic) → AMS **Unavailable** (so bare tpu-95a = false). Lower confidence
   than a product page, label it as general-type guidance + cite the wiki table.
   Closes the "off-store can't backfill" gap. **Action:** confirm you want this.

3. **INFO — ready-made coarse properties source for the faceted feature (#6).** The
   wiki drying table also carries star ratings (1-5★) per material type for **HDT,
   impact resistance, tensile strength**. I deliberately left these OUT of the
   Drying guide. They're a quick starting layer for the future comparison feature.

4. **LOW — cross-source drying differences (expected, not a bug).** Generic guide
   vs per-product can differ slightly (e.g. PLA generic 55 °C/8 h oven vs PLA Basic
   TDS 50 °C/8 h). The guide is labelled "general by type," so this is fine — but if
   we ever want them reconciled, that's a pass. Also: the wiki drying table has no
   **X1 heatbed** column, whereas per-product `dryBeforeUse` strings do — per-product
   is richer there.

5. **LOW — taxonomy mismatches to keep in mind.** Wiki plate table uses "Smooth PEI /
   High-Temperature Plate" (no catalog plate id; we have textured-pei/cool-plate/
   supertack/engineering) and lists no SuperTack. Wiki also references **PET** as a
   material type, which isn't in `materials.yaml` (PET-CF currently lands in "Other").
   Only matters if we later map the guides to per-product plate/material ids.

### Nothing needs fetching right now
The webarchive had everything. Future fetches I'll need when we get to them:
the **engineering-tier store pages** (PC/PA/PPS) if we fill those per-product, and
the **H2D temp-mix override wiki article** for the co-print / `temperatureClass`
guide (item 6 in deferred fields).

---

## Catalog vs. current US store (checked 2026-06-06)

Real but **no current US-store page** (store cautions block unavailable → AMS must
come from another source, e.g. the wiki material table; don't expect a store
paste): `bambu-pla-lite` (page 404s), `bambu-pla-dynamic`, `bambu-pla-silk`
(store now only "PLA Silk+"), `bambu-pla-tough` (store now only "PLA Tough+"),
`bambu-support-w` (store's support lineup is now PLA / PLA-PETG / ABS / PA-PET /
PVA — no "Support W"), `bambu-tpu-95a` (store TPU lineup is now TPU 85A/90A,
TPU for AMS, TPU 95A HF — no bare "TPU 95A"). All legit (profile/TDS-sourced) — **keep**, just can't
backfill AMS the usual way. Also `bambu-support-g` = store "Support for PA/PET"
(now **discontinued**; AMS still filled from its page before removal). Store
products **missing from our catalog**: PLA Translucent, PLA Silk Multi-Color,
PLA Basic Gradient (= the unmapped X2D wiki rows in §0).

---

## Deferred data points — new fields to add later (TODO)

Both raised 2026-06-06; both **deferred** (each needs a new field = schema +
validator + display, so not pure data-entry). Capture later.

1. **`temperatureClass` (low | high)** — to answer "can these two filaments
   print together?" Bambu blocks mixing high- and low-temp filaments in one
   print (see §0 X2D note). **Source to check first:** the **H2D wiki article on
   overriding that restriction** — read it to confirm whether there's a *hard*
   low/high boundary (and which materials fall where) before modeling it.
   Existing proxies in the data today: `enclosureRequired` (true ≈ high-temp) and
   `chamberTemp`. (Note: the **X2D** is this project's dual-hotend printer — real,
   brand-new; the **H2D** referenced for the override article is a separate, older
   Bambu product. Two different printers; the restriction concept likely applies
   to both, but cite each correctly.)
2. **`spoolType` (standard | high-temp reusable)** — which empty reusable spool
   you need when ordering a *refill*. Citable from the sales page: ABS/ASA say
   "Comes with High Temperature Reusable Spool"; PLA/PETG just say "refill needs
   a spool" (= standard). Likely correlates 1:1 with `temperatureClass` (heat is
   the reason), but sources differ and they answer different questions — record
   both, watch for divergence, and collapse to one only if the data proves them
   always identical.
3. ~~**`nozzleSizeMax`**~~ — **DONE (2026-06-06).** Added the field (parameters.yaml
   + validator + a "max nozzle" warning in resolve.js), set on `bambu-pla-silk-plus`,
   `bambu-pla-aero`, `bambu-asa-aero` (all max 0.4). Watch for more as data lands.
4. **AMS variant distinction (AMS / AMS 2 Pro / AMS lite / AMS HT)** —
   `amsCompatible` is a single bool, but real products differ per AMS variant:
   - "regular AMS yes, AMS lite no": `bambu-abs`, `bambu-asa`, `bambu-pla-glow`
     (glow/abrasive → AMS-lite feeding failures). Set `amsCompatible: true`.
   - **"AMS HT only"**: `bambu-tpu-90a` — compatible ONLY with AMS HT; AMS / AMS
     2 Pro / AMS lite all NOT compatible. Set `amsCompatible: false` (the common
     AMS won't take it), AMS-HT exception in a YAML comment.
   The single bool loses all this. Consider per-variant fields (`ams`, `amsLite`,
   `ams2Pro`, `amsHT`) or an enum so each is queryable.

---

## Future feature — faceted comparison / property filtering (BIG, deferred)

Goal (user, 2026-06-06): let a user pick criteria — quantitative ("HDT > 80 °C")
and qualitative ("UV stable", "glossy finish") — and get a comparison table of
which filaments **do / don't / might** meet them. Extends the previously-floated
"multi-filament comparison table" idea (see [[project-status]] / §0).

We currently record **no** mechanical/physical properties and **no** qualitative
attribute tags. The raw data has been on every store page + TDS all along (the
"Physical/Mechanical Properties" spec table and the "Product Features" bullets) —
so this needs a **full re-pass over all ~126 products** (the user accepts this).
Note many specialty/support filaments list specs as **N/A** (e.g. Support for
PLA/PETG) — the model must allow N/A / unknown, not just numbers.

Two new data layers to add (each value still needs a source link per the rule):
1. **Quantitative properties** — density, Vicat softening, HDT (note the load,
   e.g. 0.45 MPa), melting temp, melt index, tensile strength, breaking
   elongation, bending modulus, bending strength, impact strength; some TDSs give
   XY vs Z variants. Store these as numbers/ranges with units; allow `N/A`.
2. **Qualitative tags** — UV-resistant, finish (matte/glossy/silk/textured),
   biodegradable, food-contact, flexible, transparent/translucent, outdoor-rated,
   low-warp, etc. Tri-state per tag: yes / no / **unknown** (so the UI can show
   "might meet" when a property was never stated for that filament).

UI: faceted filter + dynamic comparison table. Tri-state matters — absence of a
claim is "unknown", not "no".

---

## 0. X2D dual-hotend compatibility (`src/data/x2d.yaml`)

Added the Bambu **X2D** filament-compatibility matrix from the wiki
(`wiki.bambulab.com/en/x2d/manual/filament-compatibility`) — the one source for
the whole file. Three sub-tables per filament, each rated across the 7 nozzle
columns (0.2/0.4/0.6/0.8 standard + HF 0.4/0.6/0.8): **main hotend**,
**auxiliary (second) hotend**, and **filament track switch**. Surfaced in the
app as an "X2D Compatibility" card that reads the current nozzle selection.

- **46 wiki rows; 42 join to catalog products.** Unmapped (wiki lists them, we
  don't carry them): **PLA Basic Gradient, PLA Translucent, PLA Silk Dual Color,
  TPU 85A**. Kept in `x2d.yaml` with `productId: null` for completeness / a
  future comparison table.
- **2 Bambu catalog products have no X2D row:** `bambu-pa-cf` (PA-CF) and
  `bambu-support-w` (Support W) — the wiki table doesn't list them. Card hidden
  for those.
- Tables are **not** row-identical: aux lacks PLA Basic Gradient / PLA Silk Dual
  Color; track lacks PLA Dynamic / PLA Tough / PLA Silk Dual Color. A missing
  table for a filament shows as "— not listed", not as an error.
- **X2D software constraints NOT on this wiki page** (so not displayed as sourced
  values; recorded here only): both hotends must use the **same nozzle
  diameter** in one print, and Bambu Studio blocks **mixing high- and
  low-temperature filaments** in one print (e.g. ABS + PVA). Find a citable
  source before putting these in the app (the hard source-link rule).

---

## Glue: source authority + attribution cleanup (in progress)

**Decided model:** glue is `adhesion: { required: <bool>, types: [<preference list>] }`,
recorded **per source verbatim** (resolve.js shows each source's claim side by
side, each cited). The `types` list is preference-ordered (preferred glue first).

**Source authority for glue:**
- **TDS does NOT name a glue type.** The Bambu TDS template only says "Bed
  Surface Preparation: **Glue**" — generic, no stick-vs-liquid. So a TDS source
  may carry `required: true` but must **not** carry `types`.
- **Sales page is the only source for glue *type*** (and for AMS / AMS-lite /
  enclosure). The store "Cautions for Use" + comparison + accessory-compatibility
  widgets name the specific glue(s). Reading the accessory widget: each row is
  Recommended | Not-Recommended, and a lone `/` means that column is empty. The
  glue row consistently lists BOTH "Bambu Liquid Glue" and "Glue Stick" in the
  Recommended column with `/` in Not-Recommended — both glues recommended, NOT a
  contradiction with the comparison table. (An earlier note here claimed the
  widget marked glue stick "not recommended"; that was a misread of the `/`
  placeholder.) Record both; list liquid first as the cosmetic preference.

**Attribution bug to clean up:** earlier mining attributed specific glue `types`
(mostly `[glue-stick]`) to **TDS sources**, which the TDS doesn't actually
support. Audit (2026-06-06): **70 glue-type entries across 40 files** are
TDS-attributed. Fixed so far: `bambu-abs`, `bambu-asa`.

Cleanup approach — **incremental, not mass-strip** (mass-strip would delete glue
info we can't re-source without the sales page): when we open a product's sales
page, move the real types to the store source and reduce the TDS source to
`required: true`. Caveat: **Polymaker TDS format is NOT yet verified** — ~18 of
the 40 files are Polymaker and may legitimately name a type; check before editing.

---

## Registered source — general material table (NOT yet mined)

Wiki page **"Filament guide – Printer, Nozzle, AMS, Build Plate, Glue
Compatibility and Required Parameters"**:
`wiki.bambulab.com/en/general/filament-guide-material-table` (last edited
2026-05-22). Saved locally as a `.webarchive` (gitignored — never committed).
**Found via Google, not reachable from wiki nav.** Registered for later; scope
TBD. It is keyed by **material TYPE (generic)**, not per-product, so folding it
into the per-product catalog is a modeling decision deferred for now.

Four tables it offers:
1. **Nozzle compat & temp** — availability per material across 0.2/0.4/0.6/0.8 +
   HF 0.4/0.6/0.8, hardened-steel requirement, nozzle temp range (±10 °C).
2. **AMS / AMS lite compat** — open vs. enclosed printer recommendation, and
   AMS/AMS-lite compatibility with nuances (e.g. ABS → AMS yes / AMS-lite Not
   Recommended; TPU → AMS Unavailable; brittle/abrasive caveats per brand).
3. **Build plate settings** — bed temps per material × glue, per material ×
   plate (Cool/PLA, Engineering, Smooth PEI/High-Temp, Textured PEI), cover
   removal.
4. **Storage & specs** — drying requirement, drying conditions (oven / AMS 2 Pro
   / AMS HT), desiccant need, HDT / impact / tensile star ratings.

Table #2 directly addresses the AMS gap below — could supersede the per-product
store-paste workflow with this single authoritative source (one source link for
the whole table).

### Decided plan for mining it: field-dependent authority

Authority is **per-field, not per-source**. When the generic table and a
per-product source both speak to a value, resolve by *which kind of field* it is:

1. **Per-product value wins when we have one.** A product-specific source (TDS,
   store page) is a deliberate refinement, so it takes precedence — this is where
   the nuances of a particular filament live (exact drying temp/time,
   abrasiveness, mechanical specs).
2. **Generic table fills the gaps**, labeled in the UI as *"general guidance for
   <material type>"* so it never reads as product-specific. This is most useful
   for **device-capability** facts (fits-the-nozzle, mechanically passes the
   AMS) — Bambu knows its own hardware, and third-party TDS often say nothing
   about Bambu AMS at all. Best fallback for those.
3. **Flag only true same-field conflicts.** Show both sources side-by-side ONLY
   when a per-product value and the generic table cover the *same field* and
   genuinely disagree. Keep this rare — it fits the every-value-has-a-source
   rule and avoids drowning the UI in non-conflicts.

Why #3 stays rare: most apparent conflicts are **default-vs-override, not
contradiction.** The generic table already bakes in product exceptions
(TPU → AMS "Unavailable" *but* "TPU for AMS" / "TPU 95A HF" called out as OK;
PLA-CF 0.2 mm "Unavailable" *but* "Bambu PLA-CF: Recommended" at 0.4 mm). Treat
generic rows as a default with named overrides, not a competing claim.

Sub-field nuance to watch — **AMS compatibility is really two questions:**
(a) *loads/unloads* (mechanical pass-through → device-knowable, generic table is
fine) vs (b) *long-term abrasion/wear on the PTFE* (brand/product-specific → needs
per-product judgement). The wiki itself separates these; don't collapse them into
one boolean.

---

## 1. Top filaments to check by hand (AMS + drying)

These are the highest-value everyday filaments (Bambu + Polymaker PLA/PETG/ASA/
ABS/TPU) whose **AMS compatibility is still unknown**. The Bambu store "Cautions
for Use" block gives AMS + drying + nozzle limits in one shot — paste it and I'll
fill it in. (Drying is usually already populated from the TDS; AMS is the gap.)
**Alternative now available:** the general material table above (table #2) — see
note before mining.

Bambu — store page is `us.store.bambulab.com/products/<slug>`:

| Filament | slug (best guess) | Missing |
|---|---|---|
| PLA Basic | `pla-basic` | AMS |
| PLA Matte | `pla-matte` | AMS |
| PETG HF | `petg-hf` | AMS |
| PETG Translucent | `petg-translucent` | AMS |
| ABS | `abs` | AMS |
| ASA | `asa` | AMS |
| TPU 95A | `tpu-95a` | AMS (expect "not compatible") |
| TPU 95A HF | `tpu-95a-hf` | AMS |
| TPU 90A | `tpu-90a` | AMS (expect "not compatible") |

Polymaker — `shop.polymaker.com/products/<slug>`:

| Filament | slug | Missing |
|---|---|---|
| PolyFlex TPU95 | `polyflex-tpu95` | AMS (no AMS claim on page = likely not) |
| PolyFlex TPU90 | `polyflex-tpu90` | AMS |

(Already done: Bambu PETG Basic, PLA Tough+, TPU for AMS, Support for ABS = AMS yes;
PET-CF, PPA-CF = AMS no. Polymaker rigid filaments = AMS yes per shop FAQ.)

---

## 2. Known / important gaps

### Bambu
- **AMS unknown for most filaments** — the authoritative source (store "Cautions
  for Use" block / wiki) is bot-blocked (402/403), so AMS can only be filled by
  hand. See list above.
- **4 newest entries are profile-only** (PLA Lite, PLA Tough, PA-CF, Support W):
  sourced from BambuStudio profiles because no TDS was reachable → no drying,
  AMS, or adhesion data yet.
- **`support-for-pla-petg`** — the one product with **no drying** (no TDS exists;
  only a slicer profile).
- **PLA Dynamic** drying is cited to a reseller mirror (`join3d.es`), the only
  fetchable copy found — replace if an official CDN URL turns up.
- First-layer nozzle/bed temps are generally absent (TDS don't separate them).

### Third-party (expected to be thinner)
- **No Bambu-plate-specific data** — these brands don't publish per-plate temps,
  so bed temp is recorded under `textured-pei` only (flagged with a comment).
- **Hatchbox (6) — weakest data.** Official site (hatchbox3d.com) is fully
  Cloudflare-blocked, so data came from **Amazon listings**: nozzle temp only,
  **no bed temp**, no drying/AMS/enclosure. Revisit if the site becomes reachable.
  No Hatchbox ASA exists.
- **SUNLU** — some values came from general guide/blog pages rather than per-
  product TDS; PA/PC/PVB/wood/specialty skipped; site rate-limited (429) so some
  high-speed variants are missing.
- **eSun** — TDS PDFs were unreadable (binary), so first-layer temps / volumetric
  speeds inside them aren't captured; AMS not addressed by eSun. **`eabs-max`**
  may be mislabeled — its page is eSun's UL94 V-0 flame-retardant ABS; review the
  name.
- **Overture** — first-layer temps and volumetric speed not published; AMS only
  stated for TPU (not compatible).

### Schema / cosmetic
- `Other` material is used for PPS, PVB (PolyCast/PolySmooth), PC-ABS, CoPE — no
  dedicated category. Fine for now; add categories if it gets crowded.
- Polymaker cosmetic colorways (Panchroma Silk/Galaxy/Glow/etc.) were
  intentionally **not** added — same print params as their base PLA, pure
  duplication.

### Still entirely uncovered (future)
- Prusament, Inland/Microcenter, Elegoo, Atomic, Proto-pasta, ColorFabb, etc.
