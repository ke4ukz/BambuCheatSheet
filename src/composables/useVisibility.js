import { reactive, watch } from 'vue'

const STORAGE_KEY = 'bcs-hidden-params'

function loadHidden() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

// Seed defaults from the registry the first time (params with defaultVisible:false
// start hidden), then remember the user's choices in localStorage.
export function useVisibility(parameters) {
  const stored = localStorage.getItem(STORAGE_KEY)
  const hidden = reactive(
    stored !== null
      ? loadHidden()
      : new Set(parameters.filter((p) => p.defaultVisible === false).map((p) => p.key))
  )

  watch(
    () => [...hidden],
    (val) => localStorage.setItem(STORAGE_KEY, JSON.stringify(val)),
    { immediate: true }
  )

  const isVisible = (key) => !hidden.has(key)
  const toggle = (key) => (hidden.has(key) ? hidden.delete(key) : hidden.add(key))

  return { hidden, isVisible, toggle }
}
