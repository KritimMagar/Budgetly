import { useMemo } from 'react'
import MonthSwitcher from '../components/layout/MonthSwitcher.jsx'
import CategoryBreakdown from '../components/summary/CategoryBreakdown.jsx'
import SummaryCards from '../components/summary/SummaryCards.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { breakdownByCategory, monthTotals, transactionsInMonth } from '../domain/summary.js'
import { useStore } from '../state/hooks.js'

export default function MonthView({ month, onMonthChange }) {
  const { state } = useStore()

  const monthTransactions = useMemo(
    () => transactionsInMonth(state.transactions, month),
    [state.transactions, month],
  )
  const totals = useMemo(() => monthTotals(monthTransactions), [monthTransactions])
  const breakdown = useMemo(
    () => breakdownByCategory(monthTransactions, state.categories),
    [monthTransactions, state.categories],
  )

  return (
    <div className="space-y-4">
      <MonthSwitcher month={month} onChange={onMonthChange} />
      <SummaryCards totals={totals} currency={state.settings.currency} />
      {totals.count === 0 ? (
        <EmptyState
          title="Nothing recorded this month"
          description="Add a transaction, or use the arrows above to look at another month."
        />
      ) : (
        <CategoryBreakdown
          rows={breakdown.rows}
          totalCents={breakdown.totalCents}
          currency={state.settings.currency}
          theme={state.settings.theme}
        />
      )}
    </div>
  )
}
