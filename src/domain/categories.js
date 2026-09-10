import { COLOR_KEYS, colorKeyAt } from './palette.js'

/** Every transaction keeps a category, so there is always a fallback to move to. */
export const OTHER_CATEGORY_ID = 'cat_other'

export const DEFAULT_CATEGORIES = [
  { id: 'cat_food', name: 'Food', colorKey: 'blue', builtin: true },
  { id: 'cat_rent', name: 'Rent', colorKey: 'orange', builtin: true },
  { id: 'cat_transport', name: 'Transport', colorKey: 'aqua', builtin: true },
  { id: 'cat_bills', name: 'Bills', colorKey: 'yellow', builtin: true },
  { id: 'cat_fun', name: 'Fun', colorKey: 'magenta', builtin: true },
  { id: 'cat_health', name: 'Health', colorKey: 'green', builtin: true },
  { id: OTHER_CATEGORY_ID, name: 'Other', colorKey: 'violet', builtin: true },
]

export const MAX_CATEGORY_NAME = 24

export function createDefaultCategories() {
  return DEFAULT_CATEGORIES.map((category) => ({ ...category }))
}

export function findCategory(categories, id) {
  return categories.find((category) => category.id === id) ?? null
}

/** Name of a category id, for lists and CSV rows that reference a deleted one. */
export function categoryName(categories, id) {
  return findCategory(categories, id)?.name ?? 'Unknown'
}

/**
 * @returns {{ok: true, name: string} | {ok: false, error: string}}
 */
export function validateCategoryName(rawName, categories, { excludeId = null } = {}) {
  const name = String(rawName ?? '').trim().replace(/\s+/g, ' ')
  if (name === '') return { ok: false, error: 'Enter a name' }
  if (name.length > MAX_CATEGORY_NAME) {
    return { ok: false, error: `Keep it under ${MAX_CATEGORY_NAME} characters` }
  }
  const taken = categories.some(
    (category) =>
      category.id !== excludeId && category.name.toLowerCase() === name.toLowerCase(),
  )
  if (taken) return { ok: false, error: 'That category already exists' }
  return { ok: true, name }
}

/** Next free palette slot, so new categories stay distinguishable in order. */
export function nextColorKey(categories) {
  const used = new Set(categories.map((category) => category.colorKey))
  return COLOR_KEYS.find((key) => !used.has(key)) ?? colorKeyAt(categories.length)
}
