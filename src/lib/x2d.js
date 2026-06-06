// X2D dual-hotend filament-compatibility lookups.
//
// The X2D has two hotends (main + auxiliary) and a filament track switch; the
// Bambu wiki rates every filament across nozzle sizes for each. We don't model
// "two filaments at once" — we just answer, for the single nozzle the user has
// selected, how each of the three subsystems rates the chosen filament.
import x2dData from '../data/x2d.yaml'

export const x2dSource = x2dData.source
export const x2dLegend = x2dData.legend
export const x2dColumns = x2dData.columns

// The three rated subsystems, in display order.
export const X2D_TABLES = [
  { key: 'main', label: 'Main hotend' },
  { key: 'aux', label: 'Auxiliary hotend' },
  { key: 'track', label: 'Filament track switch' },
]

// productId -> wiki row, for the filaments we actually carry in the catalog.
const byProduct = new Map(
  x2dData.filaments.filter((f) => f.productId).map((f) => [f.productId, f])
)
export function x2dForProduct(productId) {
  return byProduct.get(productId) ?? null
}

// Catalog products covered by the X2D wiki table — lets the Sources page count
// and group this source alongside the per-product sources.
export const x2dProductIds = [...byProduct.keys()]

// Map the current nozzle selection to an X2D column key, or null when the
// printer has no such nozzle (there is no high-flow 0.2 mm option).
export function x2dColumn(size, highFlow) {
  const key = highFlow ? `hf-${size}` : `${size}`
  return x2dColumns.includes(key) ? key : null
}

// { code, label } for one subsystem at the given column, or null if unrated.
export function x2dRating(entry, table, column) {
  if (!entry || !column) return null
  const code = entry[table]?.[column]
  if (!code) return null
  return { code, label: x2dLegend[table]?.[code] ?? code }
}
