import { describe, it, expect } from 'vitest'
import { breakdownByCategory, monthTotals, monthsWithData, transactionsInMonth } from './summary.js'
import { createDefaultCategories } from './categories.js'

const categories = createDefaultCategories()

const txn = (over) => ({
  id: Math.random().toString(36),
  amountCents: 1000,
  type: 'expense',
  categoryId: 'cat_food',
  date: '2026-09-10',
  note: '',
  ...over,
})

describe('transactionsInMonth', () => {
  it('includes both month boundaries and excludes neighbours', () => {
    const all = [
      txn({ date: '2026-08-31' }),
      txn({ date: '2026-09-01' }),
      txn({ date: '2026-09-30' }),
      txn({ date: '2026-10-01' }),
    ]
    expect(transactionsInMonth(all, '2026-09').map((t) => t.date)).toEqual(['2026-09-01', '2026-09-30'])
  })
})

describe('monthTotals', () => {
  it('separates income from expenses and derives the balance', () => {
    const totals = monthTotals([
      txn({ type: 'income', amountCents: 250000 }),
      txn({ amountCents: 1250 }),
      txn({ amountCents: 829 }),
    ])
    expect(totals).toEqual({ incomeCents: 250000, expenseCents: 2079, balanceCents: 247921, count: 3 })
  })

  it('reports zeroes for an empty month and allows a negative balance', () => {
    expect(monthTotals([])).toEqual({ incomeCents: 0, expenseCents: 0, balanceCents: 0, count: 0 })
    expect(monthTotals([txn({ amountCents: 500 })]).balanceCents).toBe(-500)
  })
})

describe('breakdownByCategory', () => {
  it('groups expenses by category, largest first, with shares that sum to 100', () => {
    const { rows, totalCents } = breakdownByCategory(
      [
        txn({ categoryId: 'cat_food', amountCents: 2500 }),
        txn({ categoryId: 'cat_food', amountCents: 2500 }),
        txn({ categoryId: 'cat_rent', amountCents: 5000 }),
        txn({ categoryId: 'cat_fun', amountCents: 10000 }),
        txn({ categoryId: 'cat_food', type: 'income', amountCents: 99999 }),
      ],
      categories,
    )

    expect(totalCents).toBe(20000)
    expect(rows.map((row) => [row.name, row.cents, row.percent])).toEqual([
      ['Fun', 10000, 50],
      ['Food', 5000, 25],
      ['Rent', 5000, 25],
    ])
    expect(rows.reduce((sum, row) => sum + row.percent, 0)).toBe(100)
  })

  it('can break down income instead, and stays empty when nothing matches', () => {
    const income = breakdownByCategory([txn({ type: 'income', amountCents: 700 })], categories, { type: 'income' })
    expect(income.rows).toHaveLength(1)
    expect(breakdownByCategory([], categories).rows).toEqual([])
    expect(breakdownByCategory([], categories).totalCents).toBe(0)
  })

  it('labels a category that no longer exists rather than dropping its spend', () => {
    const { rows } = breakdownByCategory([txn({ categoryId: 'cat_gone' })], categories)
    expect(rows[0]).toMatchObject({ name: 'Unknown', cents: 1000 })
  })
})

describe('monthsWithData', () => {
  it('lists distinct months newest first', () => {
    expect(
      monthsWithData([txn({ date: '2026-09-10' }), txn({ date: '2026-07-01' }), txn({ date: '2026-09-30' })]),
    ).toEqual(['2026-09', '2026-07'])
  })
})
