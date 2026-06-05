import { reactive, watch } from 'vue'

const STORAGE_KEY = 'bcs-favorites'

function load() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

// Products the user owns / cares about. Persisted per-browser; favorites float
// to the top of the filament list.
export function useFavorites() {
  const favorites = reactive(load())

  watch(
    () => [...favorites],
    (val) => localStorage.setItem(STORAGE_KEY, JSON.stringify(val)),
    { immediate: true }
  )

  const isFavorite = (id) => favorites.has(id)
  const toggle = (id) => (favorites.has(id) ? favorites.delete(id) : favorites.add(id))

  return { favorites, isFavorite, toggle }
}
