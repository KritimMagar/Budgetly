import { isInMonth } from './dates.js'
import { findCategory } from './categories.js'

/** All arithmetic here stays in integer cents; only percentages are floats. */

export function transactionsInMonth(transactions, monthKey) {
  return transactions.filter((transaction) => isInMonth(transaction.date, monthKey))
}

export function monthTotals(transactions) {
  let incomeCents = 0
  let expenseCents = 0
  for (const transaction of transactions) {
    if (transaction.type === 'income') incomeCents += transaction.amountCents
    else expenseCents += transaction.amountCents
  }
  return { incomeCents, expenseCents, balanceCents: incomeCents - expenseCents, count: transactions.length }
}

/**
 * Spend (or income) per category, largest first, with each slice's share of
 * the total as a 0-100 percentage.
 */
export function breakdownByCategory(transactions, categories, { type = 'expense' } = {}) {
  const totals = new Map()
  let totalCents = 0

  for (const transaction of transactions) {
    if (transaction.type !== type) continue
    totals.set(transaction.categoryId, (totals.get(transaction.categoryId) ?? 0) + transaction.amountCents)
    totalCents += transaction.amountCents
  }

  const rows = [...totals.entries()].map(([categoryId, cents]) => {
    const category = findCategory(categories, categoryId)
    return {
      categoryId,
      name: category?.name ?? 'Unknown',
      colorKey: category?.colorKey ?? 'violet',
      cents,
      percent: totalCents === 0 ? 0 : (cents / totalCents) * 100,
    }
  })

  rows.sort((a, b) => (b.cents !== a.cents ? b.cents - a.cents : a.name.localeCompare(b.name)))
  return { rows, totalCents }
}

/** Months that actually hold data, newest first — used to offer quick jumps. */
export function monthsWithData(transactions) {
  const months = new Set(transactions.map((transaction) => transaction.date.slice(0, 7)))
  return [...months].sort().reverse()
}
