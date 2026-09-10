import { isValidCents, parseAmount } from './money.js'
import { MIDNIGHT, isValidDate, isValidTime, isWithinRange } from './dates.js'

export const TRANSACTION_TYPES = ['income', 'expense']
export const MAX_NOTE_LENGTH = 140

export function isTransactionType(value) {
  return TRANSACTION_TYPES.includes(value)
}

/**
 * Checks a form draft before it reaches the store. Amount arrives as the raw
 * string the user typed and leaves as cents. The category has to be one of the
 * kind that matches the transaction type — an expense cannot be filed under an
 * income category.
 *
 * @returns {{ok: true, value: object} | {ok: false, errors: Record<string, string>}}
 */
export function validateTransaction(draft, { categories }) {
  const errors = {}

  const amount = parseAmount(draft.amount)
  if (!amount.ok) errors.amount = amount.error

  if (!isTransactionType(draft.type)) errors.type = 'Choose income or expense'

  const category = categories.find((entry) => entry.id === draft.categoryId)
  if (!draft.categoryId) errors.categoryId = 'Choose a category'
  else if (!category) errors.categoryId = 'That category no longer exists'
  else if (isTransactionType(draft.type) && category.kind !== draft.type) {
    errors.categoryId = `Choose an ${draft.type} category`
  }

  if (!draft.date) errors.date = 'Choose a date'
  else if (!isValidDate(draft.date)) errors.date = 'Enter a real date'

  if (!isValidTime(draft.time)) errors.time = 'Enter a time as HH:MM'

  const note = String(draft.note ?? '').trim()
  if (note.length > MAX_NOTE_LENGTH) errors.note = `Keep the note under ${MAX_NOTE_LENGTH} characters`

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return {
    ok: true,
    value: {
      amountCents: amount.cents,
      type: draft.type,
      categoryId: draft.categoryId,
      date: draft.date,
      time: draft.time,
      note,
    },
  }
}

/** Guard for anything reaching the store from storage, import or a reducer action. */
export function isStorableTransaction(value) {
  return (
    !!value &&
    typeof value.id === 'string' &&
    value.id !== '' &&
    isValidCents(value.amountCents) &&
    isTransactionType(value.type) &&
    typeof value.categoryId === 'string' &&
    isValidDate(value.date) &&
    isValidTime(value.time) &&
    typeof value.note === 'string'
  )
}

/**
 * Newest first: by date, then by time within the day, with a stable tie-break
 * so re-renders keep the same order. Times are zero-padded 24-hour strings, so
 * comparing them as text orders them correctly.
 */
export function sortTransactions(transactions) {
  return [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    const timeA = a.time ?? MIDNIGHT
    const timeB = b.time ?? MIDNIGHT
    if (timeA !== timeB) return timeA < timeB ? 1 : -1
    if (a.createdAt !== b.createdAt) return (b.createdAt ?? 0) - (a.createdAt ?? 0)
    return a.id < b.id ? 1 : -1
  })
}

/** Everything unset: the whole list, unfiltered. */
export const EMPTY_FILTERS = { query: '', type: 'all', categoryId: 'all', from: '', to: '' }

export function isFilterActive(filters) {
  return Object.keys(EMPTY_FILTERS).some((key) => (filters[key] ?? '') !== EMPTY_FILTERS[key])
}

/**
 * Narrows the list by any combination of free text, type, category and an
 * inclusive date range. Text matches the note or the category name, so
 * searching "food" finds a category as readily as a note.
 */
export function filterTransactions(transactions, filters = EMPTY_FILTERS, { categories = [] } = {}) {
  const query = String(filters.query ?? '').trim().toLowerCase()
  const names = new Map(categories.map((category) => [category.id, category.name.toLowerCase()]))

  return transactions.filter((transaction) => {
    if (filters.type && filters.type !== 'all' && transaction.type !== filters.type) return false
    if (filters.categoryId && filters.categoryId !== 'all' && transaction.categoryId !== filters.categoryId) {
      return false
    }
    if (!isWithinRange(transaction.date, filters.from, filters.to)) return false

    if (query === '') return true
    const note = String(transaction.note ?? '').toLowerCase()
    return note.includes(query) || (names.get(transaction.categoryId) ?? '').includes(query)
  })
}
