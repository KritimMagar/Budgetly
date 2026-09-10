import { useState } from 'react'
import AppShell from './components/layout/AppShell.jsx'
import MonthView from './views/MonthView.jsx'
import TransactionsView from './views/TransactionsView.jsx'
import { currentMonth } from './domain/dates.js'

const TABS = [
  { id: 'month', label: 'Month' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'budgets', label: 'Budgets' },
  { id: 'settings', label: 'Settings' },
]

// Replaced view by view as each feature lands.
const PLACEHOLDERS = {
  budgets: 'Monthly budget per category and progress against it.',
  settings: 'Currency, categories, import and export.',
}

export default function App() {
  const [tab, setTab] = useState('month')
  // Shared by the month and budget views, and deliberately not persisted:
  // every visit starts on the current month.
  const [month, setMonth] = useState(currentMonth)

  return (
    <AppShell tabs={TABS} activeTab={tab} onTabChange={setTab}>
      {tab === 'month' ? <MonthView month={month} onMonthChange={setMonth} /> : null}
      {tab === 'transactions' ? <TransactionsView /> : null}
      {PLACEHOLDERS[tab] ? (
        <section className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          {PLACEHOLDERS[tab]}
        </section>
      ) : null}
    </AppShell>
  )
}
