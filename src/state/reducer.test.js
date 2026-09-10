import { describe, it, expect } from 'vitest'
import { reducer } from './reducer.js'
import { createEmptyState } from '../domain/schema.js'
import { OTHER_CATEGORY_ID } from '../domain/categories.js'
import * as actions from './actions.js'

const VALID = {
  amountCents: 1250,
  type: 'expense',
  categoryId: 'cat_food',
  date: '2026-09-10',
  note: 'Lunch',
}

function stateWith(...transactionValues) {
  return transactionValues.reduce(
    (state, value, index) => reducer(state, actions.addTransaction(value, 1000 + index)),
    createEmptyState(),
  )
}

describe('transaction/add', () => {
  it('stores a validated transaction with an id and timestamps', () => {
    const state = stateWith(VALID)
    expect(state.transactions).toHaveLength(1)
    expect(state.transactions[0]).toMatchObject({ ...VALID, createdAt: 1000, updatedAt: 1000 })
    expect(state.transactions[0].id).toMatch(/^txn_/)
  })

  it('refuses payloads that would corrupt the store', () => {
    const base = createEmptyState()
    const bad = [
      { ...VALID, amountCents: -500 },
      { ...VALID, amountCents: 0 },
      { ...VALID, amountCents: 12.5 },
      { ...VALID, type: 'transfer' },
      { ...VALID, date: '2026-02-30' },
      { ...VALID, categoryId: 'cat_missing' },
    ]
    for (const value of bad) {
      expect(reducer(base, actions.addTransaction(value)).transactions, JSON.stringify(value)).toHaveLength(0)
    }
  })
})

describe('transaction/update', () => {
  it('applies changes while keeping id and createdAt', () => {
    const state = stateWith(VALID)
    const { id } = state.transactions[0]
    const next = reducer(state, actions.updateTransaction(id, { amountCents: 999, note: 'Dinner' }, 2000))

    expect(next.transactions[0]).toMatchObject({ id, amountCents: 999, note: 'Dinner', createdAt: 1000, updatedAt: 2000 })
  })

  it('ignores unknown ids and invalid changes', () => {
    const state = stateWith(VALID)
    const { id } = state.transactions[0]
    expect(reducer(state, actions.updateTransaction('nope', { amountCents: 1 }))).toBe(state)
    expect(reducer(state, actions.updateTransaction(id, { amountCents: -1 }))).toBe(state)
    expect(reducer(state, actions.updateTransaction(id, { categoryId: 'cat_missing' }))).toBe(state)
  })
})

describe('transaction/delete', () => {
  it('removes the transaction and leaves state alone for unknown ids', () => {
    const state = stateWith(VALID)
    const { id } = state.transactions[0]
    expect(reducer(state, actions.deleteTransaction(id)).transactions).toHaveLength(0)
    expect(reducer(state, actions.deleteTransaction('nope'))).toBe(state)
  })
})

describe('categories', () => {
  it('adds and renames', () => {
    const added = reducer(createEmptyState(), actions.addCategory('  Books  ', 'red'))
    const category = added.categories.at(-1)
    expect(category).toMatchObject({ name: 'Books', colorKey: 'red', builtin: false })

    // An unknown slot is replaced with the next one in palette order.
    const fallback = reducer(createEmptyState(), actions.addCategory('Pets', '#ff0000'))
    expect(fallback.categories.at(-1).colorKey).toBe('red')

    const renamed = reducer(added, actions.renameCategory(category.id, 'Reading'))
    expect(renamed.categories.at(-1).name).toBe('Reading')
    expect(reducer(added, actions.renameCategory(category.id, '   '))).toBe(added)
  })

  it('moves transactions and drops the budget when a category is deleted', () => {
    let state = stateWith(VALID, { ...VALID, categoryId: 'cat_rent', amountCents: 90000 })
    state = reducer(state, actions.setBudget('cat_food', 30000))

    const next = reducer(state, actions.deleteCategory('cat_food', 'cat_rent'))

    expect(next.categories.some((category) => category.id === 'cat_food')).toBe(false)
    expect(next.transactions.every((transaction) => transaction.categoryId === 'cat_rent')).toBe(true)
    expect(next.budgets).toEqual({})
  })

  it('falls back to Other when the target is unusable', () => {
    const state = stateWith(VALID)
    const next = reducer(state, actions.deleteCategory('cat_food', 'cat_gone'))
    expect(next.transactions[0].categoryId).toBe(OTHER_CATEGORY_ID)
  })

  it('never deletes Other, because transactions need somewhere to land', () => {
    const state = stateWith({ ...VALID, categoryId: OTHER_CATEGORY_ID })
    expect(reducer(state, actions.deleteCategory(OTHER_CATEGORY_ID, 'cat_food'))).toBe(state)
  })
})

describe('budget/set', () => {
  it('sets, overwrites and clears a budget', () => {
    let state = reducer(createEmptyState(), actions.setBudget('cat_food', 30000))
    expect(state.budgets).toEqual({ cat_food: 30000 })

    state = reducer(state, actions.setBudget('cat_food', 45000))
    expect(state.budgets).toEqual({ cat_food: 45000 })

    expect(reducer(state, actions.setBudget('cat_food', null)).budgets).toEqual({})
    expect(reducer(state, actions.setBudget('cat_food', -1)).budgets).toEqual({})
  })

  it('ignores unknown categories', () => {
    const state = createEmptyState()
    expect(reducer(state, actions.setBudget('cat_missing', 100))).toBe(state)
  })
})

describe('settings/update', () => {
  it('accepts a currency code and a known theme', () => {
    const state = createEmptyState()
    expect(reducer(state, actions.updateSettings({ currency: 'usd' })).settings.currency).toBe('USD')
    expect(reducer(state, actions.updateSettings({ theme: 'light' })).settings.theme).toBe('light')
  })

  it('ignores nonsense rather than storing it', () => {
    const state = createEmptyState()
    expect(reducer(state, actions.updateSettings({ currency: 'euros' }))).toBe(state)
    expect(reducer(state, actions.updateSettings({ theme: 'neon' }))).toBe(state)
  })
})

describe('state/replace', () => {
  it('normalizes whatever it is given', () => {
    const next = reducer(createEmptyState(), actions.replaceState({ transactions: 'nope' }))
    expect(next.transactions).toEqual([])
    expect(next.settings.currency).toBe('EUR')
  })
})
