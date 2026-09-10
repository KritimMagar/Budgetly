import { useState } from 'react'
import AppShell from './components/layout/AppShell.jsx'
import TransactionsView from './views/TransactionsView.jsx'

const TABS = [
  { id: 'month', label: 'Month' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'budgets', label: 'Budgets' },
  { id: 'settings', label: 'Settings' },
]

// Replaced view by view as each feature lands.
const PLACEHOLDERS = {
  month: 'Totals and the category breakdown for the selected month.',
  budgets: 'Monthly budget per category and progress against it.',
  settings: 'Currency, categories, import and export.',
}

export default function App() {
  const [tab, setTab] = useState('transactions')

  return (
    <AppShell tabs={TABS} activeTab={tab} onTabChange={setTab}>
      {tab === 'transactions' ? (
        <TransactionsView />
      ) : (
        <section className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          {PLACEHOLDERS[tab]}
        </section>
      )}
    </AppShell>
  )
}
