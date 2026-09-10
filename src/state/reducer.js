import { OTHER_CATEGORY_ID } from '../domain/categories.js'
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
      if (!hasCategory(state, transaction.categoryId)) return state
      return { ...state, transactions: [transaction, ...state.transactions] }
    }

    case 'transaction/update': {
      const { id, value, updatedAt } = action.payload
      const existing = state.transactions.find((transaction) => transaction.id === id)
      if (!existing) return state

      const next = { ...existing, ...value, id, createdAt: existing.createdAt, updatedAt }
      if (!isStorableTransaction(next)) return state
      if (!hasCategory(state, next.categoryId)) return state

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
      const { id, name, colorKey } = action.payload
      const trimmed = String(name ?? '').trim()
      if (trimmed === '' || hasCategory(state, id)) return state
      return {
        ...state,
        categories: [
          ...state.categories,
          { id, name: trimmed, colorKey: isColorKey(colorKey) ? colorKey : colorKeyAt(state.categories.length), builtin: false },
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
      const { id, reassignTo = OTHER_CATEGORY_ID } = action.payload
      // Other is the fallback every transaction can fall back to; it stays.
      if (id === OTHER_CATEGORY_ID || !hasCategory(state, id)) return state
      const target = hasCategory(state, reassignTo) && reassignTo !== id ? reassignTo : OTHER_CATEGORY_ID

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
      if (!hasCategory(state, categoryId)) return state

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
