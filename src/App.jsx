import { useState } from 'react'
import AppShell from './components/layout/AppShell.jsx'
import BudgetsView from './views/BudgetsView.jsx'
import MonthView from './views/MonthView.jsx'
import SettingsView from './views/SettingsView.jsx'
import TransactionsView from './views/TransactionsView.jsx'
import { currentMonth, monthRange } from './domain/dates.js'
import { EMPTY_FILTERS } from './domain/transactions.js'

const TABS = [
  { id: 'month', label: 'Month' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'budgets', label: 'Budgets' },
  { id: 'settings', label: 'Settings' },
]

export default function App() {
  const [tab, setTab] = useState('month')
  // Shared by the month and budget views, and deliberately not persisted:
  // every visit starts on the current month.
  const [month, setMonth] = useState(currentMonth)
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  // Opening a category from the budget view lands on the transactions it is
  // made of: that category, that month.
  function showCategory(categoryId) {
    const { start, end } = monthRange(month)
    setFilters({ ...EMPTY_FILTERS, categoryId, from: start, to: end })
    setTab('transactions')
  }

  return (
    <AppShell tabs={TABS} activeTab={tab} onTabChange={setTab}>
      {tab === 'month' ? <MonthView month={month} onMonthChange={setMonth} /> : null}
      {tab === 'transactions' ? (
        <TransactionsView filters={filters} onFiltersChange={setFilters} />
      ) : null}
      {tab === 'budgets' ? <BudgetsView month={month} onMonthChange={setMonth} onSeeCategory={showCategory} /> : null}
      {tab === 'settings' ? <SettingsView /> : null}
    </AppShell>
  )
}
