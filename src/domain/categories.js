import { COLOR_KEYS, colorKeyAt } from './palette.js'

/**
 * Categories are typed: an expense is filed under an expense category and
 * income under an income one, so the two never mix in a list or a chart.
 * Each kind keeps its own fallback, which is where orphaned transactions land
 * and which therefore can never be deleted.
 */
export const FALLBACK_CATEGORY_IDS = {
  expense: 'cat_other',
  income: 'cat_income_other',
}

export const OTHER_CATEGORY_ID = FALLBACK_CATEGORY_IDS.expense
export const CATEGORY_KINDS = ['expense', 'income']

export const DEFAULT_CATEGORIES = [
  { id: 'cat_food', name: 'Food', kind: 'expense', colorKey: 'blue', builtin: true },
  { id: 'cat_rent', name: 'Rent', kind: 'expense', colorKey: 'orange', builtin: true },
  { id: 'cat_transport', name: 'Transport', kind: 'expense', colorKey: 'aqua', builtin: true },
  { id: 'cat_bills', name: 'Bills', kind: 'expense', colorKey: 'yellow', builtin: true },
  { id: 'cat_fun', name: 'Fun', kind: 'expense', colorKey: 'magenta', builtin: true },
  { id: 'cat_health', name: 'Health', kind: 'expense', colorKey: 'green', builtin: true },
  { id: FALLBACK_CATEGORY_IDS.expense, name: 'Other', kind: 'expense', colorKey: 'violet', builtin: true },

  { id: 'cat_salary', name: 'Salary', kind: 'income', colorKey: 'blue', builtin: true },
  { id: 'cat_freelance', name: 'Freelance', kind: 'income', colorKey: 'orange', builtin: true },
  { id: 'cat_gift', name: 'Gift', kind: 'income', colorKey: 'aqua', builtin: true },
  { id: FALLBACK_CATEGORY_IDS.income, name: 'Other', kind: 'income', colorKey: 'yellow', builtin: true },
]

export const MAX_CATEGORY_NAME = 24

export function isCategoryKind(value) {
  return CATEGORY_KINDS.includes(value)
}

export function createDefaultCategories() {
  return DEFAULT_CATEGORIES.map((category) => ({ ...category }))
}

export function findCategory(categories, id) {
  return categories.find((category) => category.id === id) ?? null
}

export function categoriesOfKind(categories, kind) {
  return categories.filter((category) => category.kind === kind)
}

/** Where a transaction of this type goes when its own category is gone. */
export function fallbackCategoryId(kind) {
  return FALLBACK_CATEGORY_IDS[kind] ?? FALLBACK_CATEGORY_IDS.expense
}

export function isFallbackCategory(id) {
  return Object.values(FALLBACK_CATEGORY_IDS).includes(id)
}

/** Name of a category id, for rows that reference a deleted one. */
export function categoryName(categories, id) {
  return findCategory(categories, id)?.name ?? 'Unknown'
}

/**
 * Names only have to be unique within their own kind: each list has its own
 * "Other", and a Gift you give can sit beside a Gift you receive.
 *
 * @returns {{ok: true, name: string} | {ok: false, error: string}}
 */
export function validateCategoryName(rawName, categories, { kind, excludeId = null } = {}) {
  const name = String(rawName ?? '').trim().replace(/\s+/g, ' ')
  if (name === '') return { ok: false, error: 'Enter a name' }
  if (name.length > MAX_CATEGORY_NAME) {
    return { ok: false, error: `Keep it under ${MAX_CATEGORY_NAME} characters` }
  }
  const taken = categories.some(
    (category) =>
      category.id !== excludeId &&
      category.kind === kind &&
      category.name.toLowerCase() === name.toLowerCase(),
  )
  if (taken) return { ok: false, error: 'That category already exists' }
  return { ok: true, name }
}

/**
 * Next free palette slot within a kind. Income and expense categories never
 * share a chart, so each kind starts again at the first slot.
 */
export function nextColorKey(categories, kind) {
  const used = new Set(categoriesOfKind(categories, kind).map((category) => category.colorKey))
  const free = COLOR_KEYS.find((key) => !used.has(key))
  return free ?? colorKeyAt(categoriesOfKind(categories, kind).length)
}
