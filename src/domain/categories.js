/** Every transaction keeps a category, so there is always a fallback to move to. */
export const OTHER_CATEGORY_ID = 'cat_other'

export const DEFAULT_CATEGORIES = [
  { id: 'cat_food', name: 'Food', color: '#f97316', builtin: true },
  { id: 'cat_rent', name: 'Rent', color: '#a78bfa', builtin: true },
  { id: 'cat_transport', name: 'Transport', color: '#38bdf8', builtin: true },
  { id: 'cat_bills', name: 'Bills', color: '#facc15', builtin: true },
  { id: 'cat_fun', name: 'Fun', color: '#f472b6', builtin: true },
  { id: 'cat_health', name: 'Health', color: '#34d399', builtin: true },
  { id: OTHER_CATEGORY_ID, name: 'Other', color: '#94a3b8', builtin: true },
]

/** Offered when adding a custom category. */
export const CATEGORY_COLORS = [
  '#f97316', '#a78bfa', '#38bdf8', '#facc15', '#f472b6',
  '#34d399', '#94a3b8', '#fb7185', '#22d3ee', '#c084fc',
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

/** Picks the least-used colour so new categories stay visually distinct. */
export function nextCategoryColor(categories) {
  const used = new Set(categories.map((category) => category.color))
  return CATEGORY_COLORS.find((color) => !used.has(color)) ?? CATEGORY_COLORS[0]
}
