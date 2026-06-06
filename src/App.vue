<script setup>
import { computed, ref, watch } from 'vue'
import { useCatalog } from './composables/useCatalog'
import { useVisibility } from './composables/useVisibility'
import { useFavorites } from './composables/useFavorites'
import { resolveParameter, plateUnsupported, nozzleWarnings } from './lib/resolve'
import { searchCombos } from './lib/search'
import { collectSources } from './lib/sources'
import {
  x2dForProduct, x2dColumn, x2dRating, x2dSource, x2dProductIds, x2dColumns, x2dLegend, X2D_TABLES,
} from './lib/x2d'

const { plates, materials, parameters, products, nozzleSizes, nozzleTypes, glues, plateGlueGuidance } = useCatalog()
const plateLabel = (id) => plates.find((p) => p.id === id)?.label ?? id
const { isVisible, toggle } = useVisibility()
const { isFavorite, toggle: toggleFavorite } = useFavorites()

const ADHESION_LABELS = {
  'glue-stick': 'Glue stick',
  'liquid-glue': 'Liquid glue',
  hairspray: 'Hairspray',
  'blue-tape': 'Blue tape',
  'kapton-tape': 'Kapton tape',
}

const materialFilter = ref('')
const favoritesOnly = ref(false)
const productId = ref(products[0]?.id ?? '')
const plateId = ref(plates[0]?.id ?? '')
const nozzleSize = ref(nozzleSizes.includes(0.4) ? 0.4 : nozzleSizes[0])
const nozzleType = ref(nozzleTypes[0]?.id)
const highFlowNozzle = ref(false)
const showSettings = ref(false)
const showX2dFull = ref(false)
const view = ref('lookup')
const sourceGroups = collectSources(products, [
  { source: x2dSource, productIds: x2dProductIds },
])

// First-visit walkthrough: a 3-step tour pointing at the Parameters button,
// the search box, and the favorites star. Completion is remembered in
// localStorage so it only runs once.
const INTRO_KEY = 'bcs-intro-seen'
const TOUR_STEPS = 3
const tourStep = ref(localStorage.getItem(INTRO_KEY) === null ? 1 : 0)
function nextStep() {
  if (tourStep.value >= TOUR_STEPS) endTour()
  else tourStep.value++
}
function endTour() {
  tourStep.value = 0
  try {
    localStorage.setItem(INTRO_KEY, '1')
  } catch {
    /* private mode — fine, tour just runs again next time */
  }
}

const query = ref('')
const searchFocused = ref(false)
const highlightIndex = ref(0)

const searchResults = computed(() => searchCombos(products, plates, query.value))
watch(query, () => (highlightIndex.value = 0))

function applyResult(r) {
  materialFilter.value = ''
  favoritesOnly.value = false
  productId.value = r.product.id
  if (r.plateId) plateId.value = r.plateId
  query.value = ''
  searchFocused.value = false
}

function onSearchKeydown(e) {
  const n = searchResults.value.length
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlightIndex.value = Math.min(n - 1, highlightIndex.value + 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlightIndex.value = Math.max(0, highlightIndex.value - 1)
  } else if (e.key === 'Enter' && n) {
    e.preventDefault()
    applyResult(searchResults.value[highlightIndex.value] ?? searchResults.value[0])
  } else if (e.key === 'Escape') {
    query.value = ''
    searchFocused.value = false
    e.target.blur()
  }
}

const filteredProducts = computed(() => {
  const list = products.filter(
    (p) =>
      (!materialFilter.value || p.material === materialFilter.value) &&
      (!favoritesOnly.value || isFavorite(p.id))
  )
  // Favorites first, then the catalog's alphabetical order.
  return [...list].sort(
    (a, b) => Number(isFavorite(b.id)) - Number(isFavorite(a.id))
  )
})

const selectedProduct = computed(
  () => products.find((p) => p.id === productId.value) ?? null
)

const nozzle = computed(() => {
  const t = nozzleTypes.find((x) => x.id === nozzleType.value)
  return {
    size: nozzleSize.value,
    type: nozzleType.value,
    abrasionResistant: t?.abrasionResistant ?? false,
    highFlow: highFlowNozzle.value,
  }
})

const warnings = computed(() =>
  selectedProduct.value ? nozzleWarnings(selectedProduct.value, nozzle.value) : []
)

const unsupported = computed(
  () => selectedProduct.value && plateUnsupported(selectedProduct.value, plateId.value)
)

// X2D dual-hotend compatibility for the selected filament + current nozzle.
const x2dEntry = computed(() => x2dForProduct(productId.value))
const x2dColumnKey = computed(() => x2dColumn(nozzleSize.value, highFlowNozzle.value))
const x2dRows = computed(() =>
  X2D_TABLES.map((t) => ({
    ...t,
    rating: x2dRating(x2dEntry.value, t.key, x2dColumnKey.value),
  }))
)

const X2D_SYMBOL = { ok: '✓', caution: '!', discouraged: '‼', no: '✕' }
const x2dSymbol = (code) => X2D_SYMBOL[code] ?? '·'
const x2dLegendLabel = (table, code) => x2dLegend[table]?.[code] ?? code
const x2dColLabel = (c) => (c.startsWith('hf-') ? `HF ${c.slice(3)}` : `${c} mm`)

// Group visible parameters by their `group`, resolving each against the selection.
const groupedResults = computed(() => {
  const product = selectedProduct.value
  if (!product) return []
  const byGroup = new Map()
  for (const param of parameters) {
    if (!isVisible(param.key)) continue
    const groups = resolveParameter(product, param, plateId.value)
    if (!byGroup.has(param.group)) byGroup.set(param.group, [])
    byGroup.get(param.group).push({ param, groups })
  }
  return [...byGroup.entries()].map(([group, rows]) => ({ group, rows }))
})

function reconcileSelection() {
  if (!filteredProducts.value.some((p) => p.id === productId.value)) {
    productId.value = filteredProducts.value[0]?.id ?? ''
  }
}

function fmtNumber(v, unit) {
  if (v && typeof v === 'object' && ('min' in v || 'max' in v)) {
    const { min, max } = v
    const body = min === max ? `${min}` : `${min ?? '?'}–${max ?? '?'}`
    return `${body}${unit ?? ''}`
  }
  return `${v}${unit ?? ''}`
}

function formatValue(param, value) {
  switch (param.type) {
    case 'bool':
      return value ? (param.trueLabel ?? 'Yes') : (param.falseLabel ?? 'No')
    case 'adhesion': {
      if (!value?.required) return 'Not required'
      const types = (value.types ?? []).map((t) => ADHESION_LABELS[t] ?? t)
      return types.length ? `Required — ${types.join(' / ')}` : 'Required'
    }
    case 'nozzleSize':
      return `${value} mm`
    case 'range':
    case 'number':
      return fmtNumber(value, param.unit ? ` ${param.unit}` : '')
    default:
      return String(value)
  }
}
</script>

<template>
  <div class="app">
    <header>
      <h1>Bambu Cheat Sheet</h1>
      <div class="nav">
        <button v-if="view !== 'lookup'" class="ghost" @click="view = 'lookup'">← Back</button>
        <button v-if="view === 'lookup'" class="ghost" @click="view = 'glue'">Glue</button>
        <button v-if="view === 'lookup'" class="ghost" @click="view = 'sources'">Sources</button>
      </div>
    </header>

    <template v-if="view === 'lookup'">
    <section class="card search">
      <div v-if="tourStep === 2" class="tour-pop tour-pop-below" role="dialog">
        <p>Jump straight to any filament + plate combo here — type a brand, material, or plate, then pick a match.</p>
        <div class="tour-foot">
          <span class="tour-count">2 / {{ TOUR_STEPS }}</span>
          <span class="tour-actions">
            <button class="tour-skip" @click="endTour">Dismiss</button>
            <button class="tour-next" @click="nextStep">Next</button>
          </span>
        </div>
      </div>
      <label class="search-label">
        <span>Quick search</span>
        <input
          type="text"
          class="search-input"
          v-model="query"
          placeholder="e.g. bambu pla textured pei"
          autocomplete="off"
          @focus="searchFocused = true"
          @blur="searchFocused = false"
          @keydown="onSearchKeydown"
        />
      </label>
      <ul v-if="searchFocused && query.trim()" class="search-results">
        <li v-if="!searchResults.length" class="no-results">No matches</li>
        <li
          v-for="(r, i) in searchResults"
          :key="r.product.id + ':' + (r.plateId || '')"
          :class="{ active: i === highlightIndex }"
          @mousedown.prevent="applyResult(r)"
          @mouseenter="highlightIndex = i"
        >
          <span class="r-name">{{ r.product.manufacturer }} — {{ r.product.name }}</span>
          <span class="r-meta">
            <span v-if="r.plate" class="r-plate">{{ r.plate.label }}</span>
            <span v-if="r.unsupported" class="r-warn">not recommended</span>
          </span>
        </li>
      </ul>
    </section>

    <section class="selectors card">
      <label>
        <span>Material</span>
        <select v-model="materialFilter" @change="reconcileSelection">
          <option value="">All materials</option>
          <option v-for="m in materials" :key="m.id" :value="m.id">{{ m.label }}</option>
        </select>
      </label>

      <label class="check inline">
        <input type="checkbox" v-model="favoritesOnly" @change="reconcileSelection" />
        <span>★ Favorites only</span>
      </label>

      <label>
        <span>Filament</span>
        <div class="with-star">
          <select v-model="productId">
            <option v-for="p in filteredProducts" :key="p.id" :value="p.id">
              {{ isFavorite(p.id) ? '★ ' : '' }}{{ p.manufacturer }} — {{ p.name }}
            </option>
          </select>
          <button
            v-if="selectedProduct"
            class="star"
            :class="{ on: isFavorite(productId) }"
            :title="isFavorite(productId) ? 'Remove from favorites' : 'Add to favorites'"
            @click="toggleFavorite(productId)"
          >
            {{ isFavorite(productId) ? '★' : '☆' }}
          </button>
          <div v-if="tourStep === 3" class="tour-pop tour-pop-below tour-pop-right" role="dialog">
            <p>Star a filament to favorite it, then use <strong>★ Favorites only</strong> above to filter the list to just those.</p>
            <div class="tour-foot">
              <span class="tour-count">3 / {{ TOUR_STEPS }}</span>
              <span class="tour-actions">
                <button class="tour-skip" @click="endTour">Dismiss</button>
                <button class="tour-next" @click="nextStep">Done</button>
              </span>
            </div>
          </div>
        </div>
      </label>

      <label>
        <span>Build plate</span>
        <select v-model="plateId">
          <option v-for="pl in plates" :key="pl.id" :value="pl.id">{{ pl.label }}</option>
        </select>
      </label>

      <label>
        <span>Nozzle size</span>
        <select v-model.number="nozzleSize">
          <option v-for="s in nozzleSizes" :key="s" :value="s">{{ s }} mm</option>
        </select>
      </label>

      <label>
        <span>Nozzle type</span>
        <select v-model="nozzleType">
          <option v-for="t in nozzleTypes" :key="t.id" :value="t.id">{{ t.label }}</option>
        </select>
      </label>

      <label class="check inline">
        <input type="checkbox" v-model="highFlowNozzle" />
        <span>High-flow nozzle</span>
      </label>
    </section>

    <div class="param-wrap param-bar">
      <button class="ghost" @click="showSettings = !showSettings; endTour()">
        {{ showSettings ? 'Done' : 'Parameters' }}
      </button>
      <div v-if="tourStep === 1" class="tour-pop tour-pop-below" role="dialog">
        <p>Every parameter is shown by default. Tap <strong>Parameters</strong> to hide any you don't need.</p>
        <div class="tour-foot">
          <span class="tour-count">1 / {{ TOUR_STEPS }}</span>
          <span class="tour-actions">
            <button class="tour-skip" @click="endTour">Dismiss</button>
            <button class="tour-next" @click="nextStep">Next</button>
          </span>
        </div>
      </div>
    </div>

    <section v-if="showSettings" class="settings card">
      <h2>Show parameters</h2>
      <label v-for="p in parameters" :key="p.key" class="check">
        <input type="checkbox" :checked="isVisible(p.key)" @change="toggle(p.key)" />
        <span>{{ p.label }} <em>({{ p.group }})</em></span>
      </label>
    </section>

    <p v-if="!selectedProduct" class="empty">No filament selected.</p>

    <template v-else>
      <div v-for="w in warnings" :key="w" class="warning">⚠ {{ w }}</div>
      <div v-if="unsupported" class="warning">
        ⚠ This plate is marked as not recommended for this filament.
      </div>

      <section v-if="x2dEntry" class="card x2d">
        <h2>
          X2D Compatibility
          <a class="x2d-src" :href="x2dSource.url" target="_blank" rel="noopener">{{ x2dSource.label }}</a>
        </h2>
        <p v-if="!x2dColumnKey" class="x2d-na muted">
          The X2D has no high-flow 0.2 mm nozzle — choose a different size or turn off high-flow to see ratings.
        </p>
        <template v-else>
          <p class="x2d-sel muted">
            For the selected {{ highFlowNozzle ? 'high-flow' : 'standard' }} {{ nozzleSize }} mm nozzle:
          </p>
          <div class="x2d-current">
            <div v-for="r in x2dRows" :key="r.key" class="x2d-line">
              <span class="x2d-tbl">{{ r.label }}</span>
              <span v-if="r.rating" class="badge" :class="'b-' + r.rating.code">
                {{ x2dSymbol(r.rating.code) }} {{ r.rating.label }}
              </span>
              <span v-else class="value muted">— not listed</span>
            </div>
          </div>
        </template>

        <button class="ghost x2d-toggle" @click="showX2dFull = !showX2dFull">
          {{ showX2dFull ? 'Hide' : 'Show' }} all nozzle sizes
        </button>
        <div v-if="showX2dFull" class="x2d-grid-wrap">
          <table class="x2d-grid">
            <thead>
              <tr>
                <th></th>
                <th v-for="c in x2dColumns" :key="c">{{ x2dColLabel(c) }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in X2D_TABLES" :key="t.key">
                <th>{{ t.label }}</th>
                <td v-for="c in x2dColumns" :key="c">
                  <span
                    v-if="x2dEntry[t.key]?.[c]"
                    class="cell"
                    :class="'b-' + x2dEntry[t.key][c]"
                    :title="x2dLegendLabel(t.key, x2dEntry[t.key][c])"
                  >{{ x2dSymbol(x2dEntry[t.key][c]) }}</span>
                  <span v-else class="muted">·</span>
                </td>
              </tr>
            </tbody>
          </table>
          <p class="x2d-legendnote muted">
            ✓ Available · ! Not recommended · ‼ Highly not recommended · ✕ Unavailable
          </p>
        </div>
      </section>

      <section v-for="block in groupedResults" :key="block.group" class="card">
        <h2>{{ block.group }}</h2>
        <div v-for="{ param, groups } in block.rows" :key="param.key" class="row">
          <span class="label">{{ param.label }}</span>
          <span v-if="!groups.length" class="value muted">—</span>
          <span v-else class="value">
            <span v-for="(g, i) in groups" :key="i" class="variant">
              {{ formatValue(param, g.value) }}
              <span class="src">
                <template v-for="(s, j) in g.sources" :key="j"
                  ><a v-if="s.url" :href="s.url" target="_blank" rel="noopener">{{ s.label }}</a
                  ><span v-else>{{ s.label }}</span
                  ><span v-if="j < g.sources.length - 1">, </span></template
                >
              </span>
            </span>
          </span>
        </div>
      </section>

      <p class="legend">“—” means no data from the listed sources (unknown) — not “none”.</p>
    </template>
    </template>

    <section v-else-if="view === 'sources'" class="card sources-page">
      <h2>Data sources</h2>
      <p class="sources-intro">
        Every value in the app links to its own source. This is the consolidated,
        de-duplicated overview of where the data comes from, grouped by website.
      </p>
      <div v-for="g in sourceGroups" :key="g.host" class="source-group">
        <h3>
          <a :href="'https://' + g.host" target="_blank" rel="noopener">{{ g.host }}</a>
          <span class="count">{{ g.productCount }} {{ g.productCount === 1 ? 'product' : 'products' }}</span>
        </h3>
        <ul>
          <li v-for="l in g.links" :key="l.label">
            <a :href="l.url" target="_blank" rel="noopener">{{ l.label }}</a>
          </li>
        </ul>
      </div>
    </section>

    <section v-else-if="view === 'glue'" class="card glue-page">
      <h2>Glue reference</h2>
      <p class="sources-intro">
        Which Bambu adhesive works with which material and build plate. Per-product
        adhesion data in the lookup takes precedence; this is the general guidance.
      </p>

      <div v-for="g in glues" :key="g.id" class="glue-entry">
        <h3>{{ g.label }} <span class="glue-mfr">{{ g.manufacturer }}</span></h3>
        <p v-if="g.plateCompatibility"><strong>Plates:</strong> {{ g.plateCompatibility }}</p>
        <p>
          <strong>Materials:</strong> {{ g.materials.join(', ') }}
          <span v-if="g.materialsNote" class="muted">— {{ g.materialsNote }}</span>
        </p>
        <table v-if="g.bedTempByMaterial" class="glue-temps">
          <thead><tr><th>Material</th><th>Bed temp (with glue)</th></tr></thead>
          <tbody>
            <tr v-for="(t, m) in g.bedTempByMaterial" :key="m">
              <td>{{ m }}</td><td>{{ fmtNumber(t, ' °C') }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="g.cureTime"><strong>Cure time:</strong> {{ g.cureTime }}</p>
        <ul v-if="g.features" class="glue-features">
          <li v-for="f in g.features" :key="f">{{ f }}</li>
        </ul>
        <p v-if="g.inference" class="glue-inference muted"><em>Inference (not a Bambu claim): {{ g.inference }}</em></p>
        <p class="glue-srcs">
          <template v-for="(s, i) in g.sources" :key="i"
            ><a :href="s.url" target="_blank" rel="noopener">{{ s.label }}</a
            ><span v-if="i < g.sources.length - 1"> · </span></template>
        </p>
      </div>

      <div v-if="plateGlueGuidance" class="glue-guidance">
        <h3>Glue by build plate</h3>
        <div v-for="(note, pid) in plateGlueGuidance.notes" :key="pid" class="row">
          <span class="label">{{ plateLabel(pid) }}</span>
          <span class="value">{{ note }}</span>
        </div>
        <p class="glue-srcs">
          <a :href="plateGlueGuidance.source.url" target="_blank" rel="noopener">{{ plateGlueGuidance.source.label }}</a>
        </p>
      </div>
    </section>

    <footer>
      <p>Reference only — not for direct printer use. Always verify against the manufacturer.</p>
      <p>
        The <strong>code and design</strong> of this site are © 2026 Jonathan Dean,
        licensed under
        <a href="https://github.com/ke4ukz/BambuCheatSheet/blob/main/LICENSE" target="_blank" rel="noopener">GPLv3</a>.
        The <strong>filament data</strong> it presents is factual information
        compiled from each manufacturer's published sources — it is not claimed as
        original or proprietary and remains attributable to the respective
        manufacturers (the underlying facts are not mine).
      </p>
      <p>
        Not affiliated with, endorsed by, or sponsored by Bambu Lab or any filament
        manufacturer. “Bambu Lab,” “Polymaker,” and all other product and brand
        names are trademarks™ or registered® trademarks of their respective owners.
      </p>
      <p>
        <a href="https://github.com/ke4ukz/BambuCheatSheet/issues" target="_blank" rel="noopener">Report issues on GitHub</a>
        ·
        <a href="https://github.com/ke4ukz/BambuCheatSheet/blob/main/LICENSE" target="_blank" rel="noopener">Licensed under GPLv3</a>
      </p>
    </footer>
  </div>
</template>
