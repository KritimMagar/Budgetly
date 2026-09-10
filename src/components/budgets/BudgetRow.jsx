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

export default function BudgetRow({ row, currency, theme, onEdit }) {
  const over = row.state === 'over'

  // Spent on, but with no limit to measure it against: show the spend and the
  // way to set one, rather than hiding the category behind a separate picker.
  if (row.state === 'unbudgeted') {
    return (
      <li>
        <button
          type="button"
          onClick={() => onEdit(row.categoryId)}
          className="flex w-full items-center gap-3 rounded-xl px-1 py-2.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
        >
          <span
            aria-hidden="true"
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: colorFor(row.colorKey, theme) }}
          />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{row.name}</span>
          <span className="shrink-0 text-sm tabular text-zinc-500 dark:text-zinc-400">
            {formatMoney(row.spentCents, currency)}
          </span>
          <span className="shrink-0 rounded-lg border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
            Set limit
          </span>
        </button>
      </li>
    )
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => onEdit(row.categoryId)}
        className="w-full rounded-xl px-1 py-2 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="flex min-w-0 items-baseline gap-2">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: colorFor(row.colorKey, theme) }}
            />
            <span className="truncate text-sm font-medium">{row.name}</span>
          </span>
          <span className="shrink-0 text-sm tabular text-zinc-500 dark:text-zinc-400">
            {formatMoney(row.spentCents, currency)} of {formatMoney(row.budgetCents, currency)}
          </span>
        </div>

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
      </button>
    </li>
  )
}
