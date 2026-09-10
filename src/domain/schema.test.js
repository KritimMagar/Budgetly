import { describe, it, expect } from 'vitest'
import { createEmptyState, normalizeState } from './schema.js'
import { OTHER_CATEGORY_ID } from './categories.js'

const transaction = {
  id: 'txn_1',
  amountCents: 1250,
  type: 'expense',
  categoryId: 'cat_food',
  date: '2026-09-10',
  note: '',
  createdAt: 1,
  updatedAt: 1,
}

describe('createEmptyState', () => {
  it('starts with the default categories and dark EUR settings', () => {
    const state = createEmptyState()
    expect(state.settings).toEqual({ currency: 'EUR', theme: 'dark' })
    expect(state.categories.map((c) => c.name)).toEqual([
      'Food', 'Rent', 'Transport', 'Bills', 'Fun', 'Health', 'Other',
    ])
    expect(state.transactions).toEqual([])
    expect(state.budgets).toEqual({})
  })
})

describe('normalizeState', () => {
  it('falls back to an empty state for unusable input', () => {
    for (const input of [null, undefined, 'nope', 42, []]) {
      expect(normalizeState(input).categories.length).toBeGreaterThan(0)
      expect(normalizeState(input).transactions).toEqual([])
    }
  })

  it('keeps valid transactions and drops corrupt ones', () => {
    const state = normalizeState({
      transactions: [
        transaction,
        { ...transaction, id: 'txn_2', amountCents: -1 },
        { ...transaction, id: 'txn_3', date: 'yesterday' },
        { ...transaction, id: 'txn_4', type: 'transfer' },
        { ...transaction, id: 'txn_1' },
        null,
      ],
    })
    expect(state.transactions.map((t) => t.id)).toEqual(['txn_1'])
  })

  it('moves transactions whose category vanished to Other', () => {
    const state = normalizeState({ transactions: [{ ...transaction, categoryId: 'cat_gone' }] })
    expect(state.transactions[0].categoryId).toBe(OTHER_CATEGORY_ID)
  })

  it('drops budgets that are not positive cents or point nowhere', () => {
    const state = normalizeState({
      budgets: { cat_food: 30000, cat_rent: -5, cat_fun: 1.5, cat_gone: 100 },
    })
    expect(state.budgets).toEqual({ cat_food: 30000 })
  })

  it('repairs settings and guarantees an Other category', () => {
    expect(normalizeState({ settings: { currency: 'gbp' } }).settings.currency).toBe('GBP')
    expect(normalizeState({ settings: { currency: 'nope', theme: 'neon' } }).settings).toEqual({
      currency: 'EUR',
      theme: 'dark',
    })
    const custom = normalizeState({
      categories: [{ id: 'cat_x', name: 'X' }, { id: 'cat_y', name: 'Y' }],
    })
    expect(custom.categories.some((c) => c.id === OTHER_CATEGORY_ID)).toBe(true)
  })
})
