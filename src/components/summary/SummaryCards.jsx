import { formatMoney } from '../../domain/money.js'

function Card({ label, value, tone = 'neutral', hint }) {
  const tones = {
    neutral: 'text-zinc-900 dark:text-zinc-100',
    income: 'text-emerald-600 dark:text-emerald-400',
    expense: 'text-rose-600 dark:text-rose-400',
  }
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular ${tones[tone]}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p> : null}
    </div>
  )
}

export default function SummaryCards({ totals, currency }) {
  const negative = totals.balanceCents < 0

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Balance</p>
        <p
          className={`mt-1 text-3xl font-semibold tabular ${
            negative ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {formatMoney(totals.balanceCents, currency)}
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {totals.count} {totals.count === 1 ? 'transaction' : 'transactions'} this month
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card label="Income" value={formatMoney(totals.incomeCents, currency)} tone="income" />
        <Card label="Expenses" value={formatMoney(totals.expenseCents, currency)} tone="expense" />
      </div>
    </div>
  )
}
