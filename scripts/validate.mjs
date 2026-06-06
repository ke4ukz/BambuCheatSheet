// Validates every product YAML against the schema. Run: node scripts/validate.mjs
import { readFileSync, readdirSync } from 'node:fs'
import { load } from 'js-yaml'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'src/data/products')

const MATERIALS = new Set(['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'PA', 'PC', 'PVA', 'Other'])
const PLATES = new Set(['textured-pei', 'cool-plate', 'supertack', 'engineering'])
const ADHESION = new Set(['glue-stick', 'liquid-glue', 'hairspray', 'blue-tape', 'kapton-tape'])
const FILAMENT_FIELDS = new Set([
  'nozzleTemp', 'firstLayerNozzleTemp', 'chamberTemp', 'hardenedNozzleRequired',
  'abrasive', 'nozzleSizeMin', 'highFlowSupported', 'maxVolumetricSpeed', 'dryBeforeUse',
  'amsCompatible', 'enclosureRequired',
])
const PLATE_FIELDS = new Set(['bedTemp', 'firstLayerBedTemp', 'adhesion', 'supported'])

let errors = 0
let warns = 0
const ids = new Set()
const err = (f, m) => { console.error(`✗ ${f}: ${m}`); errors++ }
const warn = (f, m) => { console.warn(`⚠ ${f}: ${m}`); warns++ }

const isNum = (v) =>
  typeof v === 'number' ||
  (v && typeof v === 'object' && ('min' in v || 'max' in v))

for (const file of readdirSync(dir).filter((f) => f.endsWith('.yaml')).sort()) {
  let doc
  try {
    doc = load(readFileSync(join(dir, file), 'utf8'))
  } catch (e) {
    err(file, `YAML parse error: ${e.message}`)
    continue
  }
  for (const k of ['id', 'manufacturer', 'name', 'material']) {
    if (!doc?.[k]) err(file, `missing required field "${k}"`)
  }
  if (doc.material && !MATERIALS.has(doc.material)) err(file, `unknown material "${doc.material}"`)
  if (doc.id) {
    if (ids.has(doc.id)) err(file, `duplicate id "${doc.id}"`)
    ids.add(doc.id)
    const expected = file.replace(/\.yaml$/, '')
    if (doc.id !== expected) warn(file, `id "${doc.id}" != filename`)
  }
  if (!Array.isArray(doc.sources) || !doc.sources.length) {
    err(file, 'no sources')
    continue
  }
  for (const s of doc.sources) {
    if (!s.source?.label) warn(file, 'source missing label')
    // Hard rule: every value must be backed by a link. No url = no information.
    if (!s.source?.url) err(file, 'source missing url (every value needs a source link)')
    for (const key of Object.keys(s)) {
      if (key === 'source' || key === 'plates') continue
      if (!FILAMENT_FIELDS.has(key)) warn(file, `unknown filament field "${key}"`)
    }
    for (const [pid, p] of Object.entries(s.plates ?? {})) {
      if (!PLATES.has(pid)) err(file, `unknown plate id "${pid}"`)
      for (const key of Object.keys(p ?? {})) {
        if (!PLATE_FIELDS.has(key)) warn(file, `unknown plate field "${key}" on ${pid}`)
      }
      if (p?.adhesion?.required) {
        for (const t of p.adhesion.types ?? []) {
          if (!ADHESION.has(t)) err(file, `unknown adhesion type "${t}" on ${pid}`)
        }
      }
      for (const tf of ['bedTemp', 'firstLayerBedTemp']) {
        if (p?.[tf] != null && !isNum(p[tf])) err(file, `${pid}.${tf} not a number/range`)
      }
    }
  }
}

// --- X2D compatibility matrix --------------------------------------------
const X2D_CODES = new Set(['ok', 'caution', 'discouraged', 'no'])
try {
  const x2d = load(readFileSync(join(root, 'src/data/x2d.yaml'), 'utf8'))
  const f = 'x2d.yaml'
  // Hard rule: every value must be backed by a link.
  if (!x2d?.source?.url) err(f, 'source missing url (every value needs a source link)')
  const cols = new Set(x2d?.columns ?? [])
  if (!cols.size) err(f, 'no columns defined')
  for (const row of x2d?.filaments ?? []) {
    const who = `${f} [${row.name ?? '?'}]`
    if (!row.name) err(f, 'filament row missing name')
    if (row.productId != null && !ids.has(row.productId)) {
      err(who, `productId "${row.productId}" matches no product`)
    }
    for (const table of ['main', 'aux', 'track']) {
      if (!row[table]) continue
      for (const [col, code] of Object.entries(row[table])) {
        if (!cols.has(col)) err(who, `${table}: unknown column "${col}"`)
        if (!X2D_CODES.has(code)) err(who, `${table}.${col}: unknown rating "${code}"`)
      }
    }
  }
} catch (e) {
  err('x2d.yaml', `load/validate error: ${e.message}`)
}

// --- Glues registry ------------------------------------------------------
try {
  const doc = load(readFileSync(join(root, 'src/data/glues.yaml'), 'utf8'))
  const f = 'glues.yaml'
  const list = doc?.glues
  if (!Array.isArray(list)) {
    err(f, 'expected a list under "glues:"')
  } else {
    for (const g of list) {
      const who = `${f} [${g.id ?? '?'}]`
      if (!g.id) err(f, 'glue missing id')
      else if (!ADHESION.has(g.id)) warn(who, `id "${g.id}" not in known adhesion types`)
      if (!g.label) warn(who, 'missing label')
      // Hard rule: every value must be backed by a link.
      const srcs = g.sources ?? (g.source ? [g.source] : [])
      if (!srcs.length) err(who, 'no sources')
      for (const s of srcs) {
        if (!s?.url) err(who, 'source missing url (every value needs a source link)')
      }
      for (const m of g.materials ?? []) {
        if (!MATERIALS.has(m)) warn(who, `materials: unknown material "${m}"`)
      }
      for (const [m, t] of Object.entries(g.bedTempByMaterial ?? {})) {
        if (m !== 'PET' && !MATERIALS.has(m)) warn(who, `bedTempByMaterial: unknown material "${m}"`)
        if (!isNum(t)) err(who, `bedTempByMaterial.${m} not a number/range`)
      }
    }
  }
  // Plate-by-plate glue guidance (generic, not per-product).
  const pg = doc?.plateGlueGuidance
  if (pg) {
    const who = `${f} [plateGlueGuidance]`
    if (!pg.source?.url) err(who, 'source missing url (every value needs a source link)')
    for (const pid of Object.keys(pg.notes ?? {})) {
      if (!PLATES.has(pid)) warn(who, `note for unknown plate id "${pid}"`)
    }
  }
} catch (e) {
  err('glues.yaml', `load/validate error: ${e.message}`)
}

console.log(`\n${ids.size} products — ${errors} errors, ${warns} warnings`)
process.exit(errors ? 1 : 0)
