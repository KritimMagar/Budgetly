import { STORAGE_KEY, createEmptyState, normalizeState } from '../domain/schema.js'

/**
 * localStorage is treated as untrusted input: it can be absent, disabled by
 * the browser, or hold data from an older or hand-edited version.
 */
export function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyState()
    return normalizeState(JSON.parse(raw))
  } catch {
    return createEmptyState()
  }
}

/** @returns {boolean} false when the write failed (private mode, quota). */
export function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function clearState() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
