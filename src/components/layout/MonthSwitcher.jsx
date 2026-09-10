import { addMonths, currentMonth, formatMonthLabel } from '../../domain/dates.js'

function Arrow({ direction }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d={direction === 'previous' ? 'M14.5 5.5L8 12l6.5 6.5' : 'M9.5 5.5L16 12l-6.5 6.5'} />
    </svg>
  )
}

export default function MonthSwitcher({ month, onChange }) {
  const isCurrent = month === currentMonth()

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => onChange(addMonths(month, -1))}
        aria-label="Previous month"
        className="grid h-9 w-9 place-items-center rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      >
        <Arrow direction="previous" />
      </button>

      <div className="text-center">
        <p aria-live="polite" className="text-sm font-semibold">
          {formatMonthLabel(month)}
        </p>
        {!isCurrent ? (
          <button
            type="button"
            onClick={() => onChange(currentMonth())}
            className="text-xs text-emerald-600 hover:underline dark:text-emerald-400"
          >
            Back to this month
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => onChange(addMonths(month, 1))}
        aria-label="Next month"
        className="grid h-9 w-9 place-items-center rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      >
        <Arrow direction="next" />
      </button>
    </div>
  )
}
