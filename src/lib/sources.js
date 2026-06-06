// Consolidated, de-duplicated overview of every data source, grouped by website.
// Within a host, identical source labels are collapsed (each kept with one
// representative URL); productCount is how many products cite that host.
// `extraSources` carries sources not bound to a single product's `sources`
// array (e.g. the X2D wiki table, which rates many products at once). Each is
// `{ source: { url, label }, productIds: [...] }`.
export function collectSources(products, extraSources = []) {
  const hostOf = (url) => {
    try {
      return new URL(url).hostname.replace(/^www\./, '')
    } catch {
      return 'other'
    }
  }

  const hosts = new Map()
  const addSource = (source, productIds) => {
    const url = source?.url
    if (!url) return
    const host = hostOf(url)
    if (!hosts.has(host)) hosts.set(host, { host, products: new Set(), labels: new Map() })
    const h = hosts.get(host)
    for (const id of productIds) h.products.add(id)
    const label = source.label ?? url
    if (!h.labels.has(label)) h.labels.set(label, url)
  }

  for (const p of products) {
    for (const s of p.sources ?? []) addSource(s.source, [p.id])
  }
  for (const e of extraSources) addSource(e.source, e.productIds ?? [])

  return [...hosts.values()]
    .map((h) => ({
      host: h.host,
      productCount: h.products.size,
      links: [...h.labels.entries()]
        .map(([label, url]) => ({ label, url }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => b.productCount - a.productCount || a.host.localeCompare(b.host))
}
