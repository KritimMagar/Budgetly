import { createDefaultCategories, OTHER_CATEGORY_ID } from './categories.js'
import { isStorableTransaction } from './transactions.js'
import { isValidCents } from './money.js'

export const STORAGE_KEY = 'budgetly.v1'
export const SCHEMA_VERSION = 1

export const DEFAULT_SETTINGS = { currency: 'EUR', theme: 'dark' }

export function createEmptyState() {
  return {
    version: SCHEMA_VERSION,
    settings: { ...DEFAULT_SETTINGS },
    categories: createDefaultCategories(),
    transactions: [],
    budgets: {},
  }
}

function normalizeSettings(raw) {
  const currency =
    typeof raw?.currency === 'string' && /^[A-Za-z]{3}$/.test(raw.currency)
      ? raw.currency.toUpperCase()
      : DEFAULT_SETTINGS.currency
  const theme = raw?.theme === 'light' ? 'light' : 'dark'
  return { currency, theme }
}

function normalizeCategories(raw) {
  const categories = []
  const seen = new Set()

  for (const candidate of Array.isArray(raw) ? raw : []) {
    if (!candidate || typeof candidate.id !== 'string' || typeof candidate.name !== 'string') continue
    const name = candidate.name.trim()
    if (name === '' || seen.has(candidate.id)) continue
    seen.add(candidate.id)
    categories.push({
      id: candidate.id,
      name,
      color: typeof candidate.color === 'string' ? candidate.color : '#94a3b8',
      builtin: candidate.builtin === true,
    })
  }

  // Without a fallback category there is nowhere to move orphaned transactions.
  if (!seen.has(OTHER_CATEGORY_ID)) {
    const other = createDefaultCategories().find((c) => c.id === OTHER_CATEGORY_ID)
    categories.push(other)
  }
  return categories.length > 1 ? categories : createDefaultCategories()
}

/**
 * Rebuilds a trustworthy state from unknown input: anything unrecognised is
 * dropped, and transactions pointing at a missing category fall back to Other
 * rather than disappearing.
 */
export function normalizeState(raw) {
  const base = createEmptyState()
  if (!raw || typeof raw !== 'object') return base

  const categories = normalizeCategories(raw.categories)
  const categoryIds = new Set(categories.map((category) => category.id))

  const transactions = []
  const seenIds = new Set()
  for (const candidate of Array.isArray(raw.transactions) ? raw.transactions : []) {
    if (!isStorableTransaction(candidate) || seenIds.has(candidate.id)) continue
    seenIds.add(candidate.id)
    transactions.push({
      id: candidate.id,
      amountCents: candidate.amountCents,
      type: candidate.type,
      categoryId: categoryIds.has(candidate.categoryId) ? candidate.categoryId : OTHER_CATEGORY_ID,
      date: candidate.date,
      note: candidate.note,
      createdAt: Number.isFinite(candidate.createdAt) ? candidate.createdAt : 0,
      updatedAt: Number.isFinite(candidate.updatedAt) ? candidate.updatedAt : 0,
    })
  }

  const budgets = {}
  for (const [categoryId, cents] of Object.entries(raw.budgets ?? {})) {
    if (categoryIds.has(categoryId) && isValidCents(cents)) budgets[categoryId] = cents
  }

  return {
    version: SCHEMA_VERSION,
    settings: normalizeSettings(raw.settings),
    categories,
    transactions,
    budgets,
  }
}
