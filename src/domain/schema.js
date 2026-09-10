import {
  FALLBACK_CATEGORY_IDS,
  createDefaultCategories,
  fallbackCategoryId,
  isCategoryKind,
} from './categories.js'
import { isStorableTransaction } from './transactions.js'
import { isValidCents } from './money.js'
import { COLOR_KEYS, colorKeyAt, isColorKey } from './palette.js'

export const STORAGE_KEY = 'budgetly.v1'
export const SCHEMA_VERSION = 2

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

    const kind = isCategoryKind(candidate.kind) ? candidate.kind : 'expense'
    const sameKind = categories.filter((category) => category.kind === kind).length
    seen.add(candidate.id)
    categories.push({
      id: candidate.id,
      name,
      kind,
      colorKey: isColorKey(candidate.colorKey) ? candidate.colorKey : colorKeyAt(sameKind),
      builtin: candidate.builtin === true,
    })
  }

  // Each kind needs its fallback: without one there is nowhere to move
  // transactions whose own category has gone.
  const defaults = createDefaultCategories()
  for (const fallbackId of Object.values(FALLBACK_CATEGORY_IDS)) {
    if (!seen.has(fallbackId)) categories.push(defaults.find((c) => c.id === fallbackId))
  }
  return categories.length > Object.keys(FALLBACK_CATEGORY_IDS).length
    ? categories
    : createDefaultCategories()
}

/**
 * Two categories of the same kind sharing a colour is only cosmetic, but it is
 * avoidable when seeding: give the later one the next free slot.
 */
function resolveColorCollisions(categories) {
  const usedByKind = new Map()
  return categories.map((category) => {
    const used = usedByKind.get(category.kind) ?? new Set()
    // Past the eighth slot there is nothing free left, and colours repeat.
    const colorKey = used.has(category.colorKey)
      ? (COLOR_KEYS.find((key) => !used.has(key)) ?? category.colorKey)
      : category.colorKey
    used.add(colorKey)
    usedByKind.set(category.kind, used)
    return colorKey === category.colorKey ? category : { ...category, colorKey }
  })
}

/**
 * Adds any default category the stored data is missing, which is how state
 * written before income categories existed — an income list holding nothing
 * but Other — gets the full set. Stored copies always win, so a renamed
 * default keeps its name, and custom categories keep their place after the
 * defaults of their kind.
 */
function seedMissingDefaults(categories) {
  const stored = new Map(categories.map((category) => [category.id, category]))
  const seeded = createDefaultCategories().map((fallback) => stored.get(fallback.id) ?? fallback)
  const seededIds = new Set(seeded.map((category) => category.id))

  for (const category of categories) {
    if (!seededIds.has(category.id)) seeded.push(category)
  }
  return resolveColorCollisions(seeded)
}

/**
 * Rebuilds a trustworthy state from unknown input: anything unrecognised is
 * dropped, and transactions pointing at a missing category fall back to Other
 * rather than disappearing.
 */
export function normalizeState(raw) {
  const base = createEmptyState()
  if (!raw || typeof raw !== 'object') return base

  // Data older than the current schema is missing categories that did not
  // exist when it was written. Only then are defaults seeded: from this
  // version on, a default the user deleted stays deleted.
  const isCurrent = Number.isFinite(raw.version) && raw.version >= SCHEMA_VERSION
  const categories = isCurrent
    ? normalizeCategories(raw.categories)
    : seedMissingDefaults(normalizeCategories(raw.categories))
  const kindById = new Map(categories.map((category) => [category.id, category.kind]))

  const transactions = []
  const seenIds = new Set()
  for (const candidate of Array.isArray(raw.transactions) ? raw.transactions : []) {
    if (!isStorableTransaction(candidate) || seenIds.has(candidate.id)) continue
    seenIds.add(candidate.id)
    transactions.push({
      id: candidate.id,
      amountCents: candidate.amountCents,
      type: candidate.type,
      // A category of the wrong kind is as good as missing.
      categoryId:
        kindById.get(candidate.categoryId) === candidate.type
          ? candidate.categoryId
          : fallbackCategoryId(candidate.type),
      date: candidate.date,
      note: candidate.note,
      createdAt: Number.isFinite(candidate.createdAt) ? candidate.createdAt : 0,
      updatedAt: Number.isFinite(candidate.updatedAt) ? candidate.updatedAt : 0,
    })
  }

  // Only spending has a budget, so income categories never carry one.
  const budgets = {}
  for (const [categoryId, cents] of Object.entries(raw.budgets ?? {})) {
    if (kindById.get(categoryId) === 'expense' && isValidCents(cents)) budgets[categoryId] = cents
  }

  return {
    version: SCHEMA_VERSION,
    settings: normalizeSettings(raw.settings),
    categories,
    transactions,
    budgets,
  }
}
