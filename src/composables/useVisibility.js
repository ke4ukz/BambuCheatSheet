import { reactive, watch } from 'vue'

const STORAGE_KEY = 'bcs-hidden-params'

function loadHidden() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

// Everything is visible on first visit; the user can hide parameters via the
// Parameters panel, and we remember those choices in localStorage.
export function useVisibility() {
  const stored = localStorage.getItem(STORAGE_KEY)
  const hidden = reactive(stored !== null ? loadHidden() : new Set())

  watch(
    () => [...hidden],
    (val) => localStorage.setItem(STORAGE_KEY, JSON.stringify(val)),
    { immediate: true }
  )

  const isVisible = (key) => !hidden.has(key)
  const toggle = (key) => (hidden.has(key) ? hidden.delete(key) : hidden.add(key))

  return { hidden, isVisible, toggle }
}
