import { describe, it, expect } from 'vitest'
import { isStorableTransaction, sortTransactions, validateTransaction } from './transactions.js'
import { createDefaultCategories } from './categories.js'

const categories = createDefaultCategories()
const context = { categories }

const draft = {
  amount: '12.50',
  type: 'expense',
  categoryId: 'cat_food',
  date: '2026-09-10',
  time: '14:35',
  note: '  Lunch  ',
}

describe('validateTransaction', () => {
  it('returns cents and a trimmed note for a valid draft', () => {
    const result = validateTransaction(draft, context)
    expect(result).toEqual({
      ok: true,
      value: {
        amountCents: 1250,
        type: 'expense',
        categoryId: 'cat_food',
        date: '2026-09-10',
        time: '14:35',
        note: 'Lunch',
      },
    })
  })

  it('reports every problem at once, keyed by field', () => {
    const result = validateTransaction(
      { amount: '', type: 'transfer', categoryId: '', date: 'nope', time: '99:99', note: 'x'.repeat(200) },
      context,
    )
    expect(result.ok).toBe(false)
    expect(Object.keys(result.errors).sort()).toEqual([
      'amount', 'categoryId', 'date', 'note', 'time', 'type',
    ])
  })

  it('requires a usable time', () => {
    for (const time of [undefined, '', '24:00', '12:60', '9:05', 'noon']) {
      expect(validateTransaction({ ...draft, time }, context).ok, String(time)).toBe(false)
    }
    expect(validateTransaction({ ...draft, time: '00:00' }, context).ok).toBe(true)
    expect(validateTransaction({ ...draft, time: '23:59' }, context).ok).toBe(true)
  })

  it('refuses a category belonging to the other kind', () => {
    const asIncome = validateTransaction({ ...draft, type: 'income' }, context)
    expect(asIncome.ok).toBe(false)
    expect(asIncome.errors.categoryId).toMatch(/income category/i)

    const asExpense = validateTransaction({ ...draft, categoryId: 'cat_salary' }, context)
    expect(asExpense.ok).toBe(false)
    expect(asExpense.errors.categoryId).toMatch(/expense category/i)
  })

  it('accepts income filed under an income category', () => {
    const result = validateTransaction({ ...draft, type: 'income', categoryId: 'cat_salary' }, context)
    expect(result.ok).toBe(true)
  })

  it('reports a category that no longer exists', () => {
    const result = validateTransaction({ ...draft, categoryId: 'cat_gone' }, context)
    expect(result.errors.categoryId).toMatch(/no longer exists/i)
  })
})

describe('isStorableTransaction', () => {
  const stored = {
    id: 'txn_1', amountCents: 1250, type: 'expense',
    categoryId: 'cat_food', date: '2026-09-10', time: '14:35', note: '',
  }

  it('accepts a complete record and rejects broken ones', () => {
    expect(isStorableTransaction(stored)).toBe(true)
    expect(isStorableTransaction({ ...stored, id: '' })).toBe(false)
    expect(isStorableTransaction({ ...stored, amountCents: 0 })).toBe(false)
    expect(isStorableTransaction({ ...stored, note: undefined })).toBe(false)
    expect(isStorableTransaction({ ...stored, time: undefined })).toBe(false)
    expect(isStorableTransaction({ ...stored, time: '24:01' })).toBe(false)
    expect(isStorableTransaction(null)).toBe(false)
  })
})

describe('sortTransactions', () => {
  it('puts the newest date first, then the latest time within that day', () => {
    const rows = [
      { id: 'a', date: '2026-09-01', time: '23:00', createdAt: 1 },
      { id: 'b', date: '2026-09-10', time: '09:15', createdAt: 2 },
      { id: 'c', date: '2026-09-10', time: '18:40', createdAt: 3 },
      { id: 'd', date: '2026-09-10', time: '09:05', createdAt: 4 },
    ]
    expect(sortTransactions(rows).map((row) => row.id)).toEqual(['c', 'b', 'd', 'a'])
  })

  it('breaks a shared time by creation order', () => {
    const rows = [
      { id: 'a', date: '2026-09-10', time: '09:15', createdAt: 1 },
      { id: 'b', date: '2026-09-10', time: '09:15', createdAt: 2 },
    ]
    expect(sortTransactions(rows).map((row) => row.id)).toEqual(['b', 'a'])
  })

  it('treats a transaction with no time as midnight rather than breaking', () => {
    const rows = [
      { id: 'old', date: '2026-09-10', createdAt: 1 },
      { id: 'new', date: '2026-09-10', time: '00:30', createdAt: 2 },
    ]
    expect(sortTransactions(rows).map((row) => row.id)).toEqual(['new', 'old'])
  })

  it('does not mutate the array it is given', () => {
    const rows = [{ id: 'a', date: '2026-09-01' }, { id: 'b', date: '2026-09-10' }]
    sortTransactions(rows)
    expect(rows.map((row) => row.id)).toEqual(['a', 'b'])
  })
})
