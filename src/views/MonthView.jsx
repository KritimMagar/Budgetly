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
  const spending = useMemo(
    () => breakdownByCategory(monthTransactions, state.categories, { type: 'expense' }),
    [monthTransactions, state.categories],
  )
  const income = useMemo(
    () => breakdownByCategory(monthTransactions, state.categories, { type: 'income' }),
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
        <>
          <CategoryBreakdown
            title="Spending by category"
            emptyText="No expenses recorded this month."
            rows={spending.rows}
            totalCents={spending.totalCents}
            currency={state.settings.currency}
            theme={state.settings.theme}
          />
          {income.rows.length > 0 ? (
            <CategoryBreakdown
              title="Income by source"
              emptyText="No income recorded this month."
              rows={income.rows}
              totalCents={income.totalCents}
              currency={state.settings.currency}
              theme={state.settings.theme}
            />
          ) : null}
        </>
      )}
    </div>
  )
}
