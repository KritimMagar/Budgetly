import { describe, it, expect } from 'vitest'
import { breakdownByCategory, budgetProgress, monthTotals, monthsWithData, transactionsInMonth } from './summary.js'
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

describe('budgetProgress', () => {
  const budgets = { cat_food: 20000, cat_fun: 5000, cat_rent: 100000 }

  it('reports spend, remainder and state per budgeted category', () => {
    const { rows } = budgetProgress(
      [
        txn({ categoryId: 'cat_food', amountCents: 5000 }),
        txn({ categoryId: 'cat_fun', amountCents: 6000 }),
        txn({ categoryId: 'cat_rent', amountCents: 80000 }),
      ],
      budgets,
      categories,
    )

    expect(rows.map((row) => [row.name, row.spentCents, row.remainingCents, row.state])).toEqual([
      ['Fun', 6000, -1000, 'over'],
      ['Rent', 80000, 20000, 'warning'],
      ['Food', 5000, 15000, 'under'],
    ])
  })

  it('warns from 80% and only counts expenses', () => {
    const at80 = budgetProgress([txn({ categoryId: 'cat_fun', amountCents: 4000 })], budgets, categories)
    expect(at80.rows.find((row) => row.name === 'Fun').state).toBe('warning')

    const justUnder = budgetProgress([txn({ categoryId: 'cat_fun', amountCents: 3999 })], budgets, categories)
    expect(justUnder.rows.find((row) => row.name === 'Fun').state).toBe('under')

    const income = budgetProgress(
      [txn({ categoryId: 'cat_fun', type: 'income', amountCents: 9999 })],
      budgets,
      categories,
    )
    expect(income.rows.find((row) => row.name === 'Fun').spentCents).toBe(0)
  })

  it('exactly on the limit is not yet over', () => {
    const { rows } = budgetProgress([txn({ categoryId: 'cat_fun', amountCents: 5000 })], budgets, categories)
    const fun = rows.find((row) => row.name === 'Fun')
    expect(fun.state).toBe('warning')
    expect(fun.remainingCents).toBe(0)
  })

  it('lists a category spent on without a limit, and leaves it out of the totals', () => {
    const { rows, totals } = budgetProgress(
      [txn({ categoryId: 'cat_bills', amountCents: 9999 }), txn({ categoryId: 'cat_food', amountCents: 5000 })],
      { cat_food: 20000 },
      categories,
    )

    expect(rows.map((row) => [row.name, row.state, row.spentCents])).toEqual([
      ['Food', 'under', 5000],
      ['Bills', 'unbudgeted', 9999],
    ])
    // The header reads "spent of budgeted", so unbudgeted spend stays out of it.
    expect(totals).toEqual({ budgetedCents: 20000, spentCents: 5000, remainingCents: 15000, overCount: 0 })
  })

  it('gives an unbudgeted row nothing to measure progress against', () => {
    const { rows } = budgetProgress([txn({ categoryId: 'cat_food', amountCents: 5000 })], {}, categories)
    expect(rows[0]).toMatchObject({
      name: 'Food',
      state: 'unbudgeted',
      spentCents: 5000,
      budgetCents: null,
      remainingCents: null,
      percent: null,
    })
  })

  it('orders budgeted rows first, then unbudgeted ones by spend', () => {
    const { rows } = budgetProgress(
      [
        txn({ categoryId: 'cat_rent', amountCents: 95000 }),
        txn({ categoryId: 'cat_fun', amountCents: 2400 }),
        txn({ categoryId: 'cat_bills', amountCents: 6340 }),
        txn({ categoryId: 'cat_food', amountCents: 8185 }),
      ],
      { cat_bills: 6000, cat_food: 25000 },
      categories,
    )

    expect(rows.map((row) => row.name)).toEqual(['Bills', 'Food', 'Rent', 'Fun'])
  })

  it('lists a budgeted category that has not been spent on, but not an untouched one', () => {
    const { rows } = budgetProgress([], { cat_food: 20000 }, categories)
    expect(rows.map((row) => [row.name, row.spentCents])).toEqual([['Food', 0]])
  })

  it('has nothing to report with no budgets and no spending', () => {
    const { rows, totals } = budgetProgress([], {}, categories)
    expect(rows).toEqual([])
    expect(totals.budgetedCents).toBe(0)
  })

  it('never lists an income category, however it was spent', () => {
    const { rows } = budgetProgress(
      [txn({ categoryId: 'cat_salary', amountCents: 5000 }), txn({ categoryId: 'cat_salary', type: 'income', amountCents: 900 })],
      {},
      categories,
    )
    expect(rows).toEqual([])
  })
})
