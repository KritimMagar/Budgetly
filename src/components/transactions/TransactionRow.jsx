import { formatDateLabel, formatTimeLabel } from '../../domain/dates.js'
import { formatMoney, signedCents } from '../../domain/money.js'
import CategoryIcon from '../ui/CategoryIcon.jsx'

export default function TransactionRow({ transaction, category, currency, theme, onEdit }) {
  const income = transaction.type === 'income'

  return (
    <li>
      <button
        type="button"
        onClick={() => onEdit(transaction)}
        className="flex w-full items-center gap-3 px-1 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
      >
        <CategoryIcon name={category?.icon} colorKey={category?.colorKey} theme={theme} tile />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{category?.name ?? 'Unknown'}</span>
          {transaction.note ? (
            <span className="block truncate text-sm text-zinc-500 dark:text-zinc-400">
              {transaction.note}
            </span>
          ) : null}
        </span>
        <span className="shrink-0 text-right">
          <span
            className={`block font-semibold tabular ${
              income ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'
            }`}
          >
            {formatMoney(signedCents(transaction), currency, { signDisplay: 'exceptZero' })}
          </span>
          <span className="block text-xs tabular text-zinc-500 dark:text-zinc-400">
            {formatDateLabel(transaction.date)}
            {transaction.time ? ` · ${formatTimeLabel(transaction.time)}` : null}
          </span>
        </span>
      </button>
    </li>
  )
}
