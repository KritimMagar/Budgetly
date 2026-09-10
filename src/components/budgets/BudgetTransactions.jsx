import { formatDateLabel } from '../../domain/dates.js'
import { formatMoney } from '../../domain/money.js'

export const PREVIEW_LIMIT = 5

/** The category's transactions for the selected month, indented under its row. */
export default function BudgetTransactions({ transactions, currency, onSeeAll }) {
  const shown = transactions.slice(0, PREVIEW_LIMIT)

  return (
    <div className="mb-2 ml-3 border-l border-zinc-200 pl-3 dark:border-zinc-800">
      {transactions.length === 0 ? (
        <p className="py-2 text-sm text-zinc-500 dark:text-zinc-400">Nothing recorded this month.</p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
          {shown.map((transaction) => (
            <li key={transaction.id} className="flex items-baseline gap-3 py-1.5">
              <span className="min-w-0 flex-1 truncate text-sm text-zinc-600 dark:text-zinc-300">
                {transaction.note || 'No note'}
              </span>
              <span className="shrink-0 text-xs tabular text-zinc-500 dark:text-zinc-400">
                {formatDateLabel(transaction.date)}
              </span>
              <span className="shrink-0 text-sm tabular">
                {formatMoney(transaction.amountCents, currency)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {transactions.length > shown.length ? (
        <button
          type="button"
          onClick={onSeeAll}
          className="mt-1.5 rounded-lg py-1 text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
        >
          See all {transactions.length} in Transactions
        </button>
      ) : null}
    </div>
  )
}
