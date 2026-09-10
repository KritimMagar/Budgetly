import { MIDNIGHT, isValidTime } from './dates.js'
import { centsToDecimalString } from './money.js'
import { createId } from './ids.js'
import { DEFAULT_ICON } from './icons.js'
import { categoriesOfKind, fallbackCategoryId, findCategory, nextColorKey, validateCategoryName } from './categories.js'
import { isTransactionType, sortTransactions, validateTransaction } from './transactions.js'

export const CSV_COLUMNS = ['id', 'date', 'time', 'type', 'category', 'amount', 'note']

function escapeField(value) {
  const text = String(value ?? '')
  return /["\n\r,]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/**
 * One row per transaction, newest first. Amounts are always positive decimal
 * strings written from integer cents — never a float — with the sign carried
 * by the type column instead.
 */
export function toCSV(transactions, categories) {
  const lines = [CSV_COLUMNS.join(',')]

  for (const transaction of sortTransactions(transactions)) {
    lines.push([
      transaction.id,
      transaction.date,
      transaction.time ?? MIDNIGHT,
      transaction.type,
      findCategory(categories, transaction.categoryId)?.name ?? 'Unknown',
      centsToDecimalString(transaction.amountCents),
      transaction.note ?? '',
    ].map(escapeField).join(','))
  }

  // CRLF and a trailing newline: what spreadsheet software expects.
  return `${lines.join('\r\n')}\r\n`
}

/**
 * Splits CSV text into rows of fields, handling quoted fields that contain
 * commas, quotes or line breaks — a note is free text, so all three happen.
 */
export function parseCSV(text) {
  const input = String(text ?? '').replace(/^﻿/, '')
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  let started = false

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]

    if (quoted) {
      if (char !== '"') field += char
      else if (input[index + 1] === '"') {
        field += '"'
        index += 1
      } else quoted = false
      continue
    }

    if (char === '"') {
      quoted = true
      started = true
    } else if (char === ',') {
      row.push(field)
      field = ''
      started = true
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      started = false
    } else if (char !== '\r') {
      field += char
      started = true
    }
  }

  if (started || field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function columnIndexes(header) {
  const indexes = {}
  header.forEach((name, index) => {
    indexes[String(name).trim().toLowerCase()] = index
  })
  return indexes
}

/**
 * Reads exported rows back. Unknown category names are created in the list
 * matching the row's type rather than collapsed into Other, so a file exported
 * from another device keeps its own categories. A missing time column reads as
 * midnight, which is how files exported before times existed still import.
 *
 * @returns {{transactions: object[], categories: object[], invalid: {line: number, reason: string}[]}}
 */
export function transactionsFromCSV(text, { categories }) {
  const rows = parseCSV(text)
  if (rows.length === 0) return { transactions: [], categories: [], invalid: [] }

  const columns = columnIndexes(rows[0])
  for (const required of ['date', 'type', 'category', 'amount']) {
    if (!(required in columns)) {
      return { transactions: [], categories: [], invalid: [{ line: 1, reason: `Missing the ${required} column` }] }
    }
  }

  const created = []
  const transactions = []
  const invalid = []
  const seenIds = new Set()
  // Categories the file adds are visible to later rows, so one new name is
  // only created once however many rows use it.
  const known = () => [...categories, ...created]

  const at = (row, name) => (columns[name] === undefined ? '' : String(row[columns[name]] ?? '').trim())

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index]
    const line = index + 1
    if (row.length === 1 && row[0].trim() === '') continue

    const type = at(row, 'type').toLowerCase()
    if (!isTransactionType(type)) {
      invalid.push({ line, reason: `"${at(row, 'type')}" is not income or expense` })
      continue
    }

    const name = at(row, 'category')
    let category = categoriesOfKind(known(), type).find(
      (entry) => entry.name.toLowerCase() === name.toLowerCase(),
    )

    if (!category) {
      const named = validateCategoryName(name, known(), { kind: type })
      category = named.ok
        ? { id: createId('cat'), name: named.name, kind: type, colorKey: nextColorKey(known(), type), icon: DEFAULT_ICON, builtin: false }
        : findCategory(known(), fallbackCategoryId(type))
      if (named.ok) created.push(category)
    }

    const time = at(row, 'time')
    const result = validateTransaction(
      {
        amount: at(row, 'amount'),
        type,
        categoryId: category.id,
        date: at(row, 'date'),
        time: isValidTime(time) ? time : MIDNIGHT,
        note: at(row, 'note'),
      },
      { categories: known() },
    )

    if (!result.ok) {
      invalid.push({ line, reason: Object.values(result.errors)[0] })
      continue
    }

    const id = at(row, 'id') || createId('txn')
    if (seenIds.has(id)) {
      invalid.push({ line, reason: 'Duplicate id in the file' })
      continue
    }
    seenIds.add(id)
    transactions.push({ id, ...result.value })
  }

  return { transactions, categories: created, invalid }
}

/**
 * Folds an import into the current state. Rows with an id already present
 * update in place and keep their original createdAt; everything else is added.
 * `replace` drops the transactions that were not in the file — categories,
 * budgets and settings are never removed by an import.
 */
export function mergeImport(state, result, { replace = false, now = Date.now() } = {}) {
  const existing = new Map(state.transactions.map((transaction) => [transaction.id, transaction]))
  const kept = replace ? new Map() : new Map(existing)

  for (const transaction of result.transactions) {
    const previous = existing.get(transaction.id)
    kept.set(transaction.id, {
      ...transaction,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    })
  }

  return {
    ...state,
    categories: [...state.categories, ...result.categories],
    transactions: [...kept.values()],
  }
}

/** Counts for the confirmation shown before an import is applied. */
export function summarizeImport(state, result) {
  const existing = new Set(state.transactions.map((transaction) => transaction.id))
  const updated = result.transactions.filter((transaction) => existing.has(transaction.id)).length

  return {
    added: result.transactions.length - updated,
    updated,
    invalid: result.invalid.length,
    newCategories: result.categories.length,
    removedByReplace: state.transactions.filter(
      (transaction) => !result.transactions.some((row) => row.id === transaction.id),
    ).length,
  }
}
