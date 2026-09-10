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
  note: '  Lunch  ',
}

describe('validateTransaction', () => {
  it('returns cents and a trimmed note for a valid draft', () => {
    const result = validateTransaction(draft, context)
    expect(result).toEqual({
      ok: true,
      value: { amountCents: 1250, type: 'expense', categoryId: 'cat_food', date: '2026-09-10', note: 'Lunch' },
    })
  })

  it('reports every problem at once, keyed by field', () => {
    const result = validateTransaction(
      { amount: '', type: 'transfer', categoryId: '', date: 'nope', note: 'x'.repeat(200) },
      context,
    )
    expect(result.ok).toBe(false)
    expect(Object.keys(result.errors).sort()).toEqual(['amount', 'categoryId', 'date', 'note', 'type'])
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
    categoryId: 'cat_food', date: '2026-09-10', note: '',
  }

  it('accepts a complete record and rejects broken ones', () => {
    expect(isStorableTransaction(stored)).toBe(true)
    expect(isStorableTransaction({ ...stored, id: '' })).toBe(false)
    expect(isStorableTransaction({ ...stored, amountCents: 0 })).toBe(false)
    expect(isStorableTransaction({ ...stored, note: undefined })).toBe(false)
    expect(isStorableTransaction(null)).toBe(false)
  })
})

describe('sortTransactions', () => {
  it('puts the newest date first and breaks ties by creation order', () => {
    const rows = [
      { id: 'a', date: '2026-09-01', createdAt: 1 },
      { id: 'b', date: '2026-09-10', createdAt: 2 },
      { id: 'c', date: '2026-09-10', createdAt: 3 },
    ]
    expect(sortTransactions(rows).map((row) => row.id)).toEqual(['c', 'b', 'a'])
  })

  it('does not mutate the array it is given', () => {
    const rows = [{ id: 'a', date: '2026-09-01' }, { id: 'b', date: '2026-09-10' }]
    sortTransactions(rows)
    expect(rows.map((row) => row.id)).toEqual(['a', 'b'])
  })
})
