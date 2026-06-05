// Merge a product's source profiles into per-parameter results for a given
// plate selection, grouping equal values and tagging them with their sources.

function valueOf(source, param, plateId) {
  if (param.scope === 'plate') {
    return source.plates?.[plateId]?.[param.key]
  }
  return source[param.key]
}

function equal(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

// Returns [{ value, sources: [{ label, url }, ...] }] for sources that provide a value.
export function resolveParameter(product, param, plateId) {
  const groups = []
  for (const s of product.sources ?? []) {
    const v = valueOf(s, param, plateId)
    if (v === undefined || v === null || v === '') continue
    const src = { label: s.source?.label ?? 'Unknown', url: s.source?.url ?? null }
    const g = groups.find((g) => equal(g.value, v))
    if (g) {
      if (!g.sources.some((x) => x.label === src.label)) g.sources.push(src)
    } else {
      groups.push({ value: v, sources: [src] })
    }
  }
  return groups
}

// Whether any source explicitly marks this plate unsupported for the product.
export function plateUnsupported(product, plateId) {
  const sources = product.sources ?? []
  const opinions = sources
    .map((s) => s.plates?.[plateId]?.supported)
    .filter((v) => v !== undefined)
  return opinions.length > 0 && opinions.every((v) => v === false)
}

// Build human-readable warnings for the chosen nozzle.
export function nozzleWarnings(product, nozzle) {
  const warnings = []
  const needsHardened = (product.sources ?? []).some((s) => s.hardenedNozzleRequired === true)
  if (needsHardened && !nozzle.abrasionResistant) {
    warnings.push('This filament is abrasive — use a hardened (or other abrasion-resistant) nozzle.')
  }
  const mins = (product.sources ?? [])
    .map((s) => s.nozzleSizeMin)
    .filter((v) => typeof v === 'number')
  if (mins.length) {
    const min = Math.max(...mins)
    if (nozzle.size < min) {
      warnings.push(`Minimum nozzle size is ${min} mm (selected ${nozzle.size} mm).`)
    }
  }
  const noHighFlow = (product.sources ?? []).some((s) => s.highFlowSupported === false)
  if (noHighFlow && nozzle.highFlow) {
    warnings.push('This filament is not compatible with high-flow nozzles.')
  }
  return warnings
}
