import { useState } from 'react'
import AppShell from './components/layout/AppShell.jsx'
import BudgetsView from './views/BudgetsView.jsx'
import MonthView from './views/MonthView.jsx'
import SettingsView from './views/SettingsView.jsx'
import TransactionsView from './views/TransactionsView.jsx'
import { currentMonth } from './domain/dates.js'

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

  return (
    <AppShell tabs={TABS} activeTab={tab} onTabChange={setTab}>
      {tab === 'month' ? <MonthView month={month} onMonthChange={setMonth} /> : null}
      {tab === 'transactions' ? <TransactionsView /> : null}
      {tab === 'budgets' ? <BudgetsView month={month} onMonthChange={setMonth} /> : null}
      {tab === 'settings' ? <SettingsView /> : null}
    </AppShell>
  )
}
