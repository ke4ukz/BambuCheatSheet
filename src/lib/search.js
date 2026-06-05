// Rank product (× plate) combinations against a free-form query like
// "bambu pla textured pei". Plate variants are only expanded when the query
// actually mentions a plate, so a bare "bambu pla" doesn't list every product
// four times.
import { plateUnsupported } from './resolve.js'

// A few aliases so cryptic material codes are findable by common words.
const ALIASES = {
  nylon: ['pa'],
  carbon: ['cf'],
  glass: ['gf'],
}

// "plate" appears in every plate label and carries no signal — and worse, it
// would let the token "pla" prefix-match it. Drop it from matching.
const STOP = new Set(['plate'])

const WORD_RE = /[a-z0-9]+/g
const wordsOf = (s) => (s.toLowerCase().match(WORD_RE) ?? []).filter((w) => !STOP.has(w))

const tokenize = (q) => q.toLowerCase().split(/\s+/).filter(Boolean)
const variants = (t) => [t, ...(ALIASES[t] ?? [])]

// Score one query token against a word list: 1 for an exact word, 0.6 for a
// word-prefix, 0 for no match (aliases considered).
function tokenScore(words, token) {
  let best = 0
  for (const v of variants(token)) {
    for (const w of words) {
      if (w === v) return 1
      if (v.length >= 2 && w.startsWith(v)) best = Math.max(best, 0.6)
    }
  }
  return best
}

const plateWords = (pl) => wordsOf(`${pl.label} ${pl.id.replace(/-/g, ' ')}`)
const nameOf = (c) => `${c.product.manufacturer} ${c.product.name} ${c.plate?.label ?? ''}`

export function searchCombos(products, plates, query, limit = 8) {
  const tokens = tokenize(query)
  if (!tokens.length) return []

  // Only expand to specific plates the query references; otherwise one row per product.
  const matchedPlates = plates.filter((pl) => {
    const w = plateWords(pl)
    return tokens.some((t) => tokenScore(w, t) > 0)
  })
  const expand = matchedPlates.length ? matchedPlates : [null]

  const combos = []
  for (const product of products) {
    const productWords = wordsOf(`${product.manufacturer} ${product.name} ${product.material}`)
    for (const plate of expand) {
      const words = plate ? [...productWords, ...plateWords(plate)] : productWords
      let matched = 0
      let score = 0
      for (const t of tokens) {
        const s = tokenScore(words, t)
        if (s > 0) {
          matched++
          score += s
        }
      }
      if (!matched) continue
      combos.push({
        product,
        plateId: plate?.id ?? null,
        plate,
        matched,
        score,
        unsupported: plate ? plateUnsupported(product, plate.id) : false,
      })
    }
  }

  // Prefer rows that match every token; then supported combos, score, name.
  const full = combos.filter((c) => c.matched === tokens.length)
  const pool = full.length ? full : combos
  pool.sort(
    (a, b) =>
      Number(a.unsupported) - Number(b.unsupported) ||
      b.score - a.score ||
      nameOf(a).localeCompare(nameOf(b))
  )
  return pool.slice(0, limit)
}
