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

/** Warn before the limit is actually breached, not only after. */
export const BUDGET_WARNING_THRESHOLD = 0.8

function budgetState(spentCents, budgetCents) {
  if (spentCents > budgetCents) return 'over'
  if (spentCents >= budgetCents * BUDGET_WARNING_THRESHOLD) return 'warning'
  return 'under'
}

/**
 * Progress against each category budget for one month. Only expenses count,
 * and `remainingCents` goes negative once the budget is passed, so the view
 * can say "over by" without recomputing anything.
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

  const rows = []
  let budgetedCents = 0
  let spentCents = 0

  for (const category of categories) {
    if (category.kind !== 'expense') continue
    const budgetCents = budgets[category.id]
    if (!budgetCents) continue

    const spent = spentByCategory.get(category.id) ?? 0
    budgetedCents += budgetCents
    spentCents += spent

    rows.push({
      categoryId: category.id,
      name: category.name,
      colorKey: category.colorKey,
      budgetCents,
      spentCents: spent,
      remainingCents: budgetCents - spent,
      percent: (spent / budgetCents) * 100,
      state: budgetState(spent, budgetCents),
    })
  }

  // Trouble first: over budget, then closest to the limit.
  rows.sort((a, b) => b.percent - a.percent)

  return {
    rows,
    totals: {
      budgetedCents,
      spentCents,
      remainingCents: budgetedCents - spentCents,
      overCount: rows.filter((row) => row.state === 'over').length,
    },
  }
}
