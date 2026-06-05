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

console.log(`\n${ids.size} products — ${errors} errors, ${warns} warnings`)
process.exit(errors ? 1 : 0)
