import { ChevronDown, Pencil } from 'lucide-react'
import BudgetTransactions from './BudgetTransactions.jsx'
import CategoryIcon from '../ui/CategoryIcon.jsx'
import { formatMoney } from '../../domain/money.js'
import { colorFor, STATUS_COLORS } from '../../domain/palette.js'

const STATE_TEXT = {
  over: 'text-rose-600 dark:text-rose-400',
  warning: 'text-amber-600 dark:text-amber-400',
  under: 'text-zinc-500 dark:text-zinc-400',
}

/** The bar turns to a status colour as the limit nears, and the text always says so too. */
function barColor(row, theme) {
  if (row.state === 'over') return STATUS_COLORS.critical
  if (row.state === 'warning') return STATUS_COLORS.warning
  return colorFor(row.colorKey, theme)
}

function Title({ row, theme, expanded }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <CategoryIcon name={row.icon} colorKey={row.colorKey} theme={theme} />
      <span className="truncate text-sm font-medium">{row.name}</span>
      <ChevronDown
        aria-hidden="true"
        size={14}
        className={`shrink-0 text-zinc-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
      />
    </span>
  )
}

/**
 * The row body toggles the month's transactions for that category. Setting the
 * limit is a separate control alongside it, so the two never fight for the
 * same tap.
 */
export default function BudgetRow({ row, currency, theme, transactions, expanded, onToggle, onEdit, onSeeAll }) {
  const over = row.state === 'over'
  const unbudgeted = row.state === 'unbudgeted'

  return (
    <li className="relative">
      <button
        type="button"
        onClick={() => onToggle(row.categoryId)}
        aria-expanded={expanded}
        className={`w-full rounded-xl px-1 py-2.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60 ${
          unbudgeted ? 'pr-24' : 'pr-9'
        }`}
      >
        <div className="flex items-baseline justify-between gap-3">
          <Title row={row} theme={theme} expanded={expanded} />
          <span className="shrink-0 text-sm tabular text-zinc-500 dark:text-zinc-400">
            {unbudgeted
              ? formatMoney(row.spentCents, currency)
              : `${formatMoney(row.spentCents, currency)} of ${formatMoney(row.budgetCents, currency)}`}
          </span>
        </div>

        {unbudgeted ? null : (
          <>
            <div
              aria-hidden="true"
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(row.percent, 100)}%`, backgroundColor: barColor(row, theme) }}
              />
            </div>

            <p className={`mt-1 text-xs tabular ${STATE_TEXT[row.state]}`}>
              {over
                ? `${formatMoney(-row.remainingCents, currency)} over budget`
                : `${formatMoney(row.remainingCents, currency)} left`}
            </p>
          </>
        )}
      </button>

      {unbudgeted ? (
        <button
          type="button"
          onClick={() => onEdit(row.categoryId)}
          className="absolute right-1 top-2 rounded-lg border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Set limit
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onEdit(row.categoryId)}
          aria-label={`Edit the limit for ${row.name}`}
          className="absolute right-0 top-1.5 grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <Pencil aria-hidden="true" size={15} />
        </button>
      )}

      {expanded ? (
        <BudgetTransactions
          transactions={transactions}
          currency={currency}
          onSeeAll={() => onSeeAll(row.categoryId)}
        />
      ) : null}
    </li>
  )
}
