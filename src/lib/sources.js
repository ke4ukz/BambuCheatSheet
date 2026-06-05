// Consolidated, de-duplicated overview of every data source, grouped by website.
// Within a host, identical source labels are collapsed (each kept with one
// representative URL); productCount is how many products cite that host.
export function collectSources(products) {
  const hostOf = (url) => {
    try {
      return new URL(url).hostname.replace(/^www\./, '')
    } catch {
      return 'other'
    }
  }

  const hosts = new Map()
  for (const p of products) {
    for (const s of p.sources ?? []) {
      const url = s.source?.url
      if (!url) continue
      const host = hostOf(url)
      if (!hosts.has(host)) hosts.set(host, { host, products: new Set(), labels: new Map() })
      const h = hosts.get(host)
      h.products.add(p.id)
      const label = s.source.label ?? url
      if (!h.labels.has(label)) h.labels.set(label, url)
    }
  }

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
