import { describe, it, expect } from 'vitest'
import { mergeImport, parseCSV, summarizeImport, toCSV, transactionsFromCSV } from './csv.js'
import { createDefaultCategories, categoriesOfKind } from './categories.js'
import { createEmptyState } from './schema.js'

const categories = createDefaultCategories()
const context = { categories }

const txn = (over = {}) => ({
  id: 'txn_1',
  amountCents: 1250,
  type: 'expense',
  categoryId: 'cat_food',
  date: '2026-09-10',
  time: '14:35',
  note: 'Lunch',
  createdAt: 1,
  updatedAt: 1,
  ...over,
})

describe('toCSV', () => {
  it('writes the documented columns, newest first', () => {
    const csv = toCSV(
      [txn({ id: 'a', time: '09:00' }), txn({ id: 'b', time: '18:00' })],
      categories,
    )
    const lines = csv.trimEnd().split('\r\n')

    expect(lines[0]).toBe('id,date,time,type,category,amount,note')
    expect(lines[1]).toBe('b,2026-09-10,18:00,expense,Food,12.50,Lunch')
    expect(lines[2]).toBe('a,2026-09-10,09:00,expense,Food,12.50,Lunch')
    expect(csv.endsWith('\r\n')).toBe(true)
  })

  it('writes amounts from cents without going through a float', () => {
    expect(toCSV([txn({ amountCents: 5 })], categories)).toContain(',0.05,')
    expect(toCSV([txn({ amountCents: 99999999999 })], categories)).toContain(',999999999.99,')
  })

  it('quotes notes containing commas, quotes or newlines', () => {
    expect(toCSV([txn({ note: 'Lunch, with "tip"' })], categories)).toContain('"Lunch, with ""tip"""')
    expect(toCSV([txn({ note: 'two\nlines' })], categories)).toContain('"two\nlines"')
  })

  it('falls back to midnight for a transaction stored without a time', () => {
    const { time, ...withoutTime } = txn()
    expect(toCSV([withoutTime], categories)).toContain(',00:00,')
  })
})

describe('parseCSV', () => {
  it('reads quoted fields, escaped quotes and embedded separators', () => {
    expect(parseCSV('a,"b,c","say ""hi""",d')).toEqual([['a', 'b,c', 'say "hi"', 'd']])
  })

  it('handles CRLF, a trailing newline and a byte order mark', () => {
    expect(parseCSV('﻿one,two\r\nthree,four\r\n')).toEqual([['one', 'two'], ['three', 'four']])
  })

  it('keeps a line break inside a quoted field', () => {
    expect(parseCSV('a,"two\nlines"\nb,c')).toEqual([['a', 'two\nlines'], ['b', 'c']])
  })

  it('returns nothing for empty input', () => {
    expect(parseCSV('')).toEqual([])
    expect(parseCSV(null)).toEqual([])
  })
})

describe('transactionsFromCSV', () => {
  it('round-trips what toCSV wrote', () => {
    const original = txn({ note: 'Lunch, with "tip"' })
    const result = transactionsFromCSV(toCSV([original], categories), context)

    expect(result.invalid).toEqual([])
    expect(result.transactions).toEqual([
      {
        id: 'txn_1',
        amountCents: 1250,
        type: 'expense',
        categoryId: 'cat_food',
        date: '2026-09-10',
        time: '14:35',
        note: 'Lunch, with "tip"',
      },
    ])
  })

  it('reads a file exported before times existed as midnight', () => {
    const csv = 'id,date,type,category,amount,note\r\ntxn_1,2026-09-10,expense,Food,12.50,Lunch\r\n'
    expect(transactionsFromCSV(csv, context).transactions[0].time).toBe('00:00')
  })

  it('takes an unreadable time as midnight rather than rejecting the row', () => {
    const csv = 'id,date,time,type,category,amount,note\r\ntxn_1,2026-09-10,25:99,expense,Food,12.50,\r\n'
    expect(transactionsFromCSV(csv, context).transactions[0].time).toBe('00:00')
  })

  it('creates an unknown category in the list matching the row type, once', () => {
    const csv = [
      'id,date,time,type,category,amount,note',
      'a,2026-09-10,09:00,income,Dividends,10.00,',
      'b,2026-09-11,09:00,income,Dividends,20.00,',
    ].join('\r\n')
    const result = transactionsFromCSV(csv, context)

    expect(result.categories).toHaveLength(1)
    expect(result.categories[0]).toMatchObject({ name: 'Dividends', kind: 'income', builtin: false })
    expect(result.transactions[0].categoryId).toBe(result.categories[0].id)
    expect(result.transactions[1].categoryId).toBe(result.categories[0].id)
  })

  it('matches an existing category by name within its own kind, ignoring case', () => {
    const csv = [
      'id,date,time,type,category,amount,note',
      'a,2026-09-10,09:00,expense,food,10.00,',
      'b,2026-09-10,09:00,income,salary,10.00,',
    ].join('\r\n')
    const result = transactionsFromCSV(csv, context)

    expect(result.categories).toEqual([])
    expect(result.transactions.map((t) => t.categoryId)).toEqual(['cat_food', 'cat_salary'])
  })

  it('falls back to Other when a name cannot be a category', () => {
    const csv = `id,date,time,type,category,amount,note\r\na,2026-09-10,09:00,expense,${'x'.repeat(40)},10.00,\r\n`
    const result = transactionsFromCSV(csv, context)

    expect(result.categories).toEqual([])
    expect(result.transactions[0].categoryId).toBe('cat_other')
  })

  it('reports bad rows by line number and keeps the good ones', () => {
    const csv = [
      'id,date,time,type,category,amount,note',
      'a,2026-09-10,09:00,expense,Food,10.00,fine',
      'b,2026-09-10,09:00,transfer,Food,10.00,bad type',
      'c,2026-13-45,09:00,expense,Food,10.00,bad date',
      'd,2026-09-10,09:00,expense,Food,-5,negative',
      'e,2026-09-10,09:00,expense,Food,0,zero',
      'a,2026-09-10,09:00,expense,Food,10.00,duplicate id',
    ].join('\r\n')
    const result = transactionsFromCSV(csv, context)

    expect(result.transactions.map((t) => t.id)).toEqual(['a'])
    expect(result.invalid.map((entry) => entry.line)).toEqual([3, 4, 5, 6, 7])
    expect(result.invalid[4].reason).toMatch(/duplicate id/i)
  })

  it('generates an id for a row that has none', () => {
    const csv = 'date,time,type,category,amount,note\r\n2026-09-10,09:00,expense,Food,10.00,\r\n'
    expect(transactionsFromCSV(csv, context).transactions[0].id).toMatch(/^txn_/)
  })

  it('refuses a file missing a column it cannot do without', () => {
    const result = transactionsFromCSV('id,date,time,note\r\nx,2026-09-10,09:00,hi\r\n', context)
    expect(result.transactions).toEqual([])
    expect(result.invalid[0].reason).toMatch(/missing the type column/i)
  })

  it('has nothing to say about an empty file', () => {
    expect(transactionsFromCSV('', context)).toEqual({ transactions: [], categories: [], invalid: [] })
  })
})

describe('mergeImport', () => {
  const state = { ...createEmptyState(), transactions: [txn({ id: 'kept' }), txn({ id: 'shared', note: 'old' })] }
  const result = {
    transactions: [{ ...txn({ id: 'shared', note: 'new' }) }, { ...txn({ id: 'fresh' }) }],
    categories: [],
    invalid: [],
  }

  it('updates by id, adds the rest and leaves the others alone', () => {
    const merged = mergeImport(state, result, { now: 500 })
    const byId = Object.fromEntries(merged.transactions.map((t) => [t.id, t]))

    expect(Object.keys(byId).sort()).toEqual(['fresh', 'kept', 'shared'])
    expect(byId.shared.note).toBe('new')
    // An updated row keeps when it was first created.
    expect(byId.shared).toMatchObject({ createdAt: 1, updatedAt: 500 })
    expect(byId.fresh).toMatchObject({ createdAt: 500, updatedAt: 500 })
  })

  it('drops what the file does not contain when replacing', () => {
    const merged = mergeImport(state, result, { replace: true, now: 500 })
    expect(merged.transactions.map((t) => t.id).sort()).toEqual(['fresh', 'shared'])
  })

  it('adds imported categories and never removes existing ones', () => {
    const withCategory = { ...result, categories: [{ id: 'cat_new', name: 'Tips', kind: 'income', colorKey: 'red' }] }
    const merged = mergeImport(state, withCategory, { replace: true })

    expect(merged.categories).toHaveLength(state.categories.length + 1)
    expect(categoriesOfKind(merged.categories, 'income').at(-1).name).toBe('Tips')
  })
})

describe('summarizeImport', () => {
  it('counts what applying the file would do', () => {
    const state = { ...createEmptyState(), transactions: [txn({ id: 'a' }), txn({ id: 'b' })] }
    const result = {
      transactions: [txn({ id: 'b' }), txn({ id: 'c' })],
      categories: [{ id: 'cat_new' }],
      invalid: [{ line: 4, reason: 'nope' }],
    }

    expect(summarizeImport(state, result)).toEqual({
      added: 1,
      updated: 1,
      invalid: 1,
      newCategories: 1,
      removedByReplace: 1,
    })
  })
})
