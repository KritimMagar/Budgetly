import { formatMoney } from '../../domain/money.js'
import { colorFor } from '../../domain/palette.js'

const SIZE = 120
const RADIUS = 44
const STROKE = 16
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
/** Surface-coloured gap between arcs, in the same units as the circumference. */
const GAP = 2

function sliceColor(slice, theme) {
  if (slice.colorKey) return colorFor(slice.colorKey, theme)
  // The remainder and the folded tail are not categories, so they stay neutral.
  return theme === 'light' ? '#d4d4d8' : '#3f3f46'
}

/**
 * Spending against the month's budget as a ring: each budgeted category is an
 * arc and the unused budget closes it. The list below names every slice, so
 * the ring is the shape of the split and never the only way to read it.
 */
export default function BudgetDonut({ donut, currency, theme, label }) {
  const over = donut.overCents > 0
  let offset = 0

  return (
    <div className="flex items-center gap-4">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-32 w-32 shrink-0 -rotate-90"
        role="img"
        aria-label={label}
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-zinc-100 dark:stroke-zinc-800"
        />
        {donut.slices.map((slice) => {
          const length = (slice.percent / 100) * CIRCUMFERENCE
          // Never let the gap eat a small slice entirely.
          const drawn = Math.max(length - GAP, 1)
          const dash = `${drawn} ${CIRCUMFERENCE - drawn}`
          const dashOffset = -offset
          offset += length

          return (
            <circle
              key={slice.key}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              stroke={sliceColor(slice, theme)}
              strokeDasharray={dash}
              strokeDashoffset={dashOffset}
            />
          )
        })}
      </svg>

      <div className="min-w-0">
        <p
          className={`text-2xl font-semibold tabular ${
            over ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-900 dark:text-zinc-100'
          }`}
        >
          {Math.round(donut.usedPercent)}%
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">of your budget used</p>
        {over ? (
          <p className="mt-1 text-sm tabular text-rose-600 dark:text-rose-400">
            {formatMoney(donut.overCents, currency)} over in total
          </p>
        ) : null}
      </div>
    </div>
  )
}
