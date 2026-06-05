# Data gaps & manual to-do

Status as of the overnight data expansion. The catalog now has **126 products**
(Bambu 44, Polymaker 44, SUNLU 11, Overture 11, eSun 10, Hatchbox 6). Validator
passes (every value is backed by a source link).

---

## 1. Top filaments to check by hand (AMS + drying)

These are the highest-value everyday filaments (Bambu + Polymaker PLA/PETG/ASA/
ABS/TPU) whose **AMS compatibility is still unknown**. The Bambu store "Cautions
for Use" block gives AMS + drying + nozzle limits in one shot — paste it and I'll
fill it in. (Drying is usually already populated from the TDS; AMS is the gap.)

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
