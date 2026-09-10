import { describe, it, expect } from 'vitest'
import { SCHEMA_VERSION, createEmptyState, normalizeState } from './schema.js'
import { FALLBACK_CATEGORY_IDS, OTHER_CATEGORY_ID, categoriesOfKind } from './categories.js'

const transaction = {
  id: 'txn_1',
  amountCents: 1250,
  type: 'expense',
  categoryId: 'cat_food',
  date: '2026-09-10',
  time: '14:35',
  note: '',
  createdAt: 1,
  updatedAt: 1,
}

describe('createEmptyState', () => {
  it('starts with the default categories and dark EUR settings', () => {
    const state = createEmptyState()
    expect(state.settings).toEqual({ currency: 'EUR', theme: 'dark' })
    expect(categoriesOfKind(state.categories, 'expense').map((c) => c.name)).toEqual([
      'Food', 'Rent', 'Transport', 'Bills', 'Fun', 'Health', 'Other',
    ])
    expect(categoriesOfKind(state.categories, 'income').map((c) => c.name)).toEqual([
      'Salary', 'Freelance', 'Gift', 'Other',
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

  it('moves transactions whose category vanished to the fallback for their type', () => {
    const expense = normalizeState({ transactions: [{ ...transaction, categoryId: 'cat_gone' }] })
    expect(expense.transactions[0].categoryId).toBe(OTHER_CATEGORY_ID)

    const income = normalizeState({
      transactions: [{ ...transaction, type: 'income', categoryId: 'cat_gone' }],
    })
    expect(income.transactions[0].categoryId).toBe(FALLBACK_CATEGORY_IDS.income)
  })

  it('gives a transaction stored before times existed midnight, rather than dropping it', () => {
    const { time, ...withoutTime } = transaction
    const state = normalizeState({
      transactions: [
        withoutTime,
        { ...transaction, id: 'txn_2', time: '24:99' },
        { ...transaction, id: 'txn_3', time: 7 },
        { ...transaction, id: 'txn_4', time: '08:15' },
      ],
    })

    expect(state.transactions.map((t) => [t.id, t.time])).toEqual([
      ['txn_1', '00:00'],
      ['txn_2', '00:00'],
      ['txn_3', '00:00'],
      ['txn_4', '08:15'],
    ])
  })

  it('gives categories stored before icons existed the icon their default carries', () => {
    const state = normalizeState({
      version: 2,
      categories: [
        { id: 'cat_food', name: 'Food', kind: 'expense' },
        { id: 'cat_salary', name: 'Salary', kind: 'income' },
        { id: 'cat_mine', name: 'Mine', kind: 'expense' },
        { id: 'cat_kept', name: 'Kept', kind: 'expense', icon: 'music' },
        { id: 'cat_odd', name: 'Odd', kind: 'expense', icon: 'not-an-icon' },
      ],
    })
    const icons = Object.fromEntries(state.categories.map((c) => [c.id, c.icon]))

    expect(icons.cat_food).toBe('utensils')
    expect(icons.cat_salary).toBe('wallet')
    expect(icons.cat_kept).toBe('music')
    // A category the defaults know nothing about falls back to the neutral one.
    expect(icons.cat_mine).toBe('tag')
    expect(icons.cat_odd).toBe('tag')
  })

  it('rehomes a transaction filed under a category of the wrong kind', () => {
    const state = normalizeState({
      transactions: [
        { ...transaction, id: 'txn_a', type: 'income', categoryId: 'cat_food' },
        { ...transaction, id: 'txn_b', type: 'expense', categoryId: 'cat_salary' },
      ],
    })
    expect(state.transactions.map((t) => t.categoryId)).toEqual([
      FALLBACK_CATEGORY_IDS.income,
      OTHER_CATEGORY_ID,
    ])
  })

  it('keeps a fallback for both kinds and defaults an unknown kind to expense', () => {
    const state = normalizeState({ categories: [{ id: 'cat_x', name: 'X', kind: 'savings' }] })
    expect(state.categories.find((c) => c.id === 'cat_x')?.kind).toBe('expense')
    for (const fallbackId of Object.values(FALLBACK_CATEGORY_IDS)) {
      expect(state.categories.some((c) => c.id === fallbackId), fallbackId).toBe(true)
    }
  })

  it('drops budgets that are not positive cents, point nowhere, or belong to income', () => {
    const state = normalizeState({
      budgets: { cat_food: 30000, cat_rent: -5, cat_fun: 1.5, cat_gone: 100, cat_salary: 500 },
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

describe('seeding defaults into older data', () => {
  const names = (state, kind) => categoriesOfKind(state.categories, kind).map((c) => c.name)

  it('fills in an income list that holds nothing but Other', () => {
    // What the app stored before income categories existed: the expense set,
    // untyped, and an income list normalizeState could only give a fallback.
    const state = normalizeState({
      version: 1,
      categories: [
        { id: 'cat_food', name: 'Food' },
        { id: 'cat_rent', name: 'Rent' },
        { id: 'cat_transport', name: 'Transport' },
        { id: 'cat_bills', name: 'Bills' },
        { id: 'cat_fun', name: 'Fun' },
        { id: 'cat_health', name: 'Health' },
        { id: 'cat_other', name: 'Other' },
        { id: FALLBACK_CATEGORY_IDS.income, name: 'Other', kind: 'income' },
      ],
      transactions: [{ ...transaction, type: 'income', categoryId: FALLBACK_CATEGORY_IDS.income }],
      budgets: { cat_food: 25000 },
    })

    expect(names(state, 'income')).toEqual(['Salary', 'Freelance', 'Gift', 'Other'])
    expect(names(state, 'expense')).toEqual(['Food', 'Rent', 'Transport', 'Bills', 'Fun', 'Health', 'Other'])
  })

  it('keeps the data it is seeding around', () => {
    const state = normalizeState({
      version: 1,
      categories: [{ id: 'cat_food', name: 'Food' }, { id: 'cat_other', name: 'Other' }],
      transactions: [transaction],
      budgets: { cat_food: 25000 },
      settings: { currency: 'GBP', theme: 'light' },
    })

    expect(state.transactions).toHaveLength(1)
    expect(state.budgets).toEqual({ cat_food: 25000 })
    expect(state.settings).toEqual({ currency: 'GBP', theme: 'light' })
  })

  it('lets stored categories win over the defaults they replace', () => {
    const state = normalizeState({
      version: 1,
      categories: [
        { id: 'cat_food', name: 'Groceries', kind: 'expense', colorKey: 'red' },
        { id: 'cat_books', name: 'Books', kind: 'expense', colorKey: 'green' },
        { id: 'cat_tips', name: 'Tips', kind: 'income', colorKey: 'blue' },
      ],
    })

    const food = state.categories.find((c) => c.id === 'cat_food')
    expect(food).toMatchObject({ name: 'Groceries', colorKey: 'red' })

    // Custom categories survive and sit after the defaults of their kind.
    expect(names(state, 'expense').at(-1)).toBe('Books')
    expect(names(state, 'income')).toEqual(['Salary', 'Freelance', 'Gift', 'Other', 'Tips'])

    // Tips claimed blue before Salary was seeded, so Salary takes a free slot.
    const byKind = categoriesOfKind(state.categories, 'income').map((c) => c.colorKey)
    expect(new Set(byKind).size).toBe(byKind.length)
  })

  it('leaves data at the current version alone, so a deleted default stays deleted', () => {
    const withoutFun = createEmptyState().categories.filter((c) => c.id !== 'cat_fun')
    const state = normalizeState({ ...createEmptyState(), categories: withoutFun })

    expect(state.categories.some((c) => c.id === 'cat_fun')).toBe(false)
    expect(names(state, 'income')).toEqual(['Salary', 'Freelance', 'Gift', 'Other'])
  })

  it('stamps the current schema version so seeding only happens once', () => {
    expect(normalizeState({ version: 1, categories: [] }).version).toBe(SCHEMA_VERSION)
    expect(createEmptyState().version).toBe(SCHEMA_VERSION)
  })
})
