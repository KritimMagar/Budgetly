import {
  categoriesOfKind,
  fallbackCategoryId,
  isCategoryKind,
  isFallbackCategory,
} from '../domain/categories.js'
import { colorKeyAt, isColorKey } from '../domain/palette.js'
import { isValidCents } from '../domain/money.js'
import { normalizeState } from '../domain/schema.js'
import { isStorableTransaction } from '../domain/transactions.js'

/**
 * Pure state transitions. Every case returns the previous state untouched when
 * a payload would corrupt the store, so a bug in a caller can never persist a
 * negative amount or an orphaned category.
 */
export function reducer(state, action) {
  switch (action.type) {
    case 'transaction/add': {
      const transaction = action.payload
      if (!isStorableTransaction(transaction)) return state
      if (!hasCategoryOfKind(state, transaction.categoryId, transaction.type)) return state
      return { ...state, transactions: [transaction, ...state.transactions] }
    }

    case 'transaction/update': {
      const { id, value, updatedAt } = action.payload
      const existing = state.transactions.find((transaction) => transaction.id === id)
      if (!existing) return state

      const next = { ...existing, ...value, id, createdAt: existing.createdAt, updatedAt }
      if (!isStorableTransaction(next)) return state
      if (!hasCategoryOfKind(state, next.categoryId, next.type)) return state

      return {
        ...state,
        transactions: state.transactions.map((transaction) =>
          transaction.id === id ? next : transaction,
        ),
      }
    }

    case 'transaction/delete': {
      const { id } = action.payload
      if (!state.transactions.some((transaction) => transaction.id === id)) return state
      return {
        ...state,
        transactions: state.transactions.filter((transaction) => transaction.id !== id),
      }
    }

    case 'category/add': {
      const { id, name, kind, colorKey } = action.payload
      const trimmed = String(name ?? '').trim()
      if (trimmed === '' || !isCategoryKind(kind) || hasCategory(state, id)) return state
      return {
        ...state,
        categories: [
          ...state.categories,
          {
            id,
            name: trimmed,
            kind,
            colorKey: isColorKey(colorKey)
              ? colorKey
              : colorKeyAt(categoriesOfKind(state.categories, kind).length),
            builtin: false,
          },
        ],
      }
    }

    case 'category/rename': {
      const { id, name } = action.payload
      const trimmed = String(name ?? '').trim()
      if (trimmed === '' || !hasCategory(state, id)) return state
      return {
        ...state,
        categories: state.categories.map((category) =>
          category.id === id ? { ...category, name: trimmed } : category,
        ),
      }
    }

    case 'category/delete': {
      const { id, reassignTo } = action.payload
      const removed = state.categories.find((category) => category.id === id)
      // Each kind's fallback is where its orphans land, so it stays.
      if (!removed || isFallbackCategory(id)) return state

      // Moving spending into an income category would corrupt every total.
      const proposed = state.categories.find((category) => category.id === reassignTo)
      const target =
        proposed && proposed.id !== id && proposed.kind === removed.kind
          ? proposed.id
          : fallbackCategoryId(removed.kind)

      const { [id]: _removed, ...budgets } = state.budgets
      return {
        ...state,
        categories: state.categories.filter((category) => category.id !== id),
        transactions: state.transactions.map((transaction) =>
          transaction.categoryId === id ? { ...transaction, categoryId: target } : transaction,
        ),
        budgets,
      }
    }

    case 'budget/set': {
      const { categoryId, cents } = action.payload
      // Budgets are a spending limit; income categories do not get one.
      if (!hasCategoryOfKind(state, categoryId, 'expense')) return state

      if (!isValidCents(cents)) {
        if (!(categoryId in state.budgets)) return state
        const { [categoryId]: _cleared, ...budgets } = state.budgets
        return { ...state, budgets }
      }
      return { ...state, budgets: { ...state.budgets, [categoryId]: cents } }
    }

    case 'settings/update': {
      const patch = {}
      if (typeof action.payload.currency === 'string' && /^[A-Za-z]{3}$/.test(action.payload.currency)) {
        patch.currency = action.payload.currency.toUpperCase()
      }
      if (action.payload.theme === 'dark' || action.payload.theme === 'light') {
        patch.theme = action.payload.theme
      }
      if (Object.keys(patch).length === 0) return state
      return { ...state, settings: { ...state.settings, ...patch } }
    }

    // Used by import and reset, where the input is untrusted by definition.
    case 'state/replace':
      return normalizeState(action.payload)

    default:
      return state
  }
}

function hasCategory(state, id) {
  return state.categories.some((category) => category.id === id)
}

function hasCategoryOfKind(state, id, kind) {
  return state.categories.some((category) => category.id === id && category.kind === kind)
}
