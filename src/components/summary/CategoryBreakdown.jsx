import { formatMoney } from '../../domain/money.js'
import { colorFor } from '../../domain/palette.js'

function formatPercent(percent) {
  if (percent > 0 && percent < 1) return '<1%'
  return `${Math.round(percent)}%`
}

/**
 * A ranked bar list: the bar carries magnitude, the row text carries identity
 * and the exact value. Every bar is directly labelled, so colour is never the
 * only thing distinguishing one category from another.
 */
export default function CategoryBreakdown({ title, emptyText, rows, totalCents, currency, theme }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-sm tabular text-zinc-500 dark:text-zinc-400">
          {formatMoney(totalCents, currency)}
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{emptyText}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.categoryId}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-medium">{row.name}</span>
                <span className="shrink-0 text-sm tabular">
                  {formatMoney(row.cents, currency)}
                  <span className="ml-2 text-zinc-500 dark:text-zinc-400">
                    {formatPercent(row.percent)}
                  </span>
                </span>
              </div>
              <div
                aria-hidden="true"
                className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    // A category worth a fraction of a percent still gets a visible sliver.
                    width: `${Math.max(row.percent, 1.5)}%`,
                    backgroundColor: colorFor(row.colorKey, theme),
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
