import { isInMonth } from './dates.js'
import { findCategory } from './categories.js'
import { sumCents } from './money.js'

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
      icon: category?.icon,
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

/** Warn before the limit is actually breached, not only after. */
export const BUDGET_WARNING_THRESHOLD = 0.8

function budgetState(spentCents, budgetCents) {
  if (spentCents > budgetCents) return 'over'
  if (spentCents >= budgetCents * BUDGET_WARNING_THRESHOLD) return 'warning'
  return 'under'
}

/**
 * One row per expense category that either has a budget or was spent on this
 * month, so spending is visible before a limit exists. Budgeted rows carry
 * progress; the rest carry the amount spent and nothing to measure it against.
 *
 * Ordering: over budget first, then nearest the limit, then unbudgeted rows by
 * spend descending.
 */
export function budgetProgress(monthTransactions, budgets, categories) {
  const spentByCategory = new Map()
  for (const transaction of monthTransactions) {
    if (transaction.type !== 'expense') continue
    spentByCategory.set(
      transaction.categoryId,
      (spentByCategory.get(transaction.categoryId) ?? 0) + transaction.amountCents,
    )
  }

  const budgeted = []
  const unbudgeted = []
  let budgetedCents = 0
  let spentCents = 0

  for (const category of categories) {
    if (category.kind !== 'expense') continue

    const budgetCents = budgets[category.id]
    const spent = spentByCategory.get(category.id) ?? 0

    if (budgetCents) {
      budgetedCents += budgetCents
      spentCents += spent
      budgeted.push({
        categoryId: category.id,
        name: category.name,
        colorKey: category.colorKey,
        icon: category.icon,
        budgetCents,
        spentCents: spent,
        remainingCents: budgetCents - spent,
        percent: (spent / budgetCents) * 100,
        state: budgetState(spent, budgetCents),
      })
    } else if (spent > 0) {
      unbudgeted.push({
        categoryId: category.id,
        name: category.name,
        colorKey: category.colorKey,
        icon: category.icon,
        budgetCents: null,
        spentCents: spent,
        remainingCents: null,
        percent: null,
        state: 'unbudgeted',
      })
    }
  }

  // Trouble first: over budget, then closest to the limit.
  budgeted.sort((a, b) => (b.percent !== a.percent ? b.percent - a.percent : a.name.localeCompare(b.name)))
  unbudgeted.sort((a, b) =>
    b.spentCents !== a.spentCents ? b.spentCents - a.spentCents : a.name.localeCompare(b.name),
  )

  return {
    rows: [...budgeted, ...unbudgeted],
    totals: {
      budgetedCents,
      spentCents,
      remainingCents: budgetedCents - spentCents,
      overCount: budgeted.filter((row) => row.state === 'over').length,
    },
  }
}

/** Five categories plus the unused remainder — past six segments a ring stops being readable. */
export const MAX_DONUT_SLICES = 5

/**
 * The month's budget as a whole: one slice per budgeted category that was
 * spent on, plus whatever is left unspent. Slices are ordered largest first,
 * and the smallest are folded together rather than shaved into unreadable
 * slivers.
 *
 * Spending in categories with no limit is left out, because it is not part of
 * this whole — the same reason it stays out of the header total.
 */
export function budgetDonut(rows, totals) {
  const spent = rows
    .filter((row) => row.budgetCents !== null && row.spentCents > 0)
    .map((row) => ({
      key: row.categoryId,
      name: row.name,
      colorKey: row.colorKey,
      cents: row.spentCents,
    }))
    .sort((a, b) => (b.cents !== a.cents ? b.cents - a.cents : a.name.localeCompare(b.name)))

  let categories = spent
  if (spent.length > MAX_DONUT_SLICES) {
    const shown = spent.slice(0, MAX_DONUT_SLICES - 1)
    const folded = spent.slice(MAX_DONUT_SLICES - 1)
    categories = [
      ...shown,
      {
        key: 'folded',
        name: `${folded.length} smaller categories`,
        colorKey: null,
        cents: sumCents(folded.map((slice) => slice.cents)),
      },
    ]
  }

  // Overspending makes the whole bigger than the budget; there is no remainder.
  const whole = Math.max(totals.budgetedCents, totals.spentCents)
  const slices = [...categories]
  if (totals.remainingCents > 0) {
    slices.push({ key: 'remaining', name: 'Left to spend', colorKey: null, cents: totals.remainingCents })
  }

  return {
    slices: slices.map((slice) => ({ ...slice, percent: whole === 0 ? 0 : (slice.cents / whole) * 100 })),
    categoryCount: categories.length,
    usedPercent: totals.budgetedCents === 0 ? 0 : (totals.spentCents / totals.budgetedCents) * 100,
    overCents: Math.max(0, totals.spentCents - totals.budgetedCents),
  }
}
