import { useMemo, useState } from 'react'
import MonthSwitcher from '../components/layout/MonthSwitcher.jsx'
import BudgetEditor from '../components/budgets/BudgetEditor.jsx'
import BudgetRow from '../components/budgets/BudgetRow.jsx'
import Button from '../components/ui/Button.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Modal from '../components/ui/Modal.jsx'
import { findCategory } from '../domain/categories.js'
import { formatMoney } from '../domain/money.js'
import { budgetProgress, transactionsInMonth } from '../domain/summary.js'
import { setBudget } from '../state/actions.js'
import { useStore } from '../state/hooks.js'

export default function BudgetsView({ month, onMonthChange }) {
  const { state, dispatch } = useStore()
  const [editingId, setEditingId] = useState(null)

  const monthTransactions = useMemo(
    () => transactionsInMonth(state.transactions, month),
    [state.transactions, month],
  )
  const { rows, totals } = useMemo(
    () => budgetProgress(monthTransactions, state.budgets, state.categories),
    [monthTransactions, state.budgets, state.categories],
  )

  const withoutBudget = state.categories.filter((category) => !state.budgets[category.id])
  const editingCategory = editingId ? findCategory(state.categories, editingId) : null
  const currency = state.settings.currency

  function save(cents) {
    dispatch(setBudget(editingId, cents))
    setEditingId(null)
  }

  function clear() {
    dispatch(setBudget(editingId, null))
    setEditingId(null)
  }

  return (
    <div className="space-y-4">
      <MonthSwitcher month={month} onChange={onMonthChange} />

      {rows.length === 0 ? (
        <EmptyState
          title="No budgets set"
          description="Give a category a monthly limit and this month's spending is measured against it."
        />
      ) : (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-semibold">Budgets</h2>
            <p className="text-sm tabular text-zinc-500 dark:text-zinc-400">
              {formatMoney(totals.spentCents, currency)} of {formatMoney(totals.budgetedCents, currency)}
            </p>
          </div>
          {totals.overCount > 0 ? (
            <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">
              {totals.overCount} {totals.overCount === 1 ? 'category is' : 'categories are'} over budget
            </p>
          ) : null}

          <ul className="mt-3 space-y-2">
            {rows.map((row) => (
              <BudgetRow
                key={row.categoryId}
                row={row}
                currency={currency}
                theme={state.settings.theme}
                onEdit={setEditingId}
              />
            ))}
          </ul>
        </section>
      )}

      {withoutBudget.length > 0 ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-semibold">No budget yet</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {withoutBudget.map((category) => (
              <li key={category.id}>
                <Button variant="secondary" size="sm" onClick={() => setEditingId(category.id)}>
                  <span aria-hidden="true" className="text-base leading-none">+</span>
                  {category.name}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Modal
        open={editingCategory !== null}
        title={state.budgets[editingId] ? 'Edit budget' : 'Set budget'}
        onClose={() => setEditingId(null)}
      >
        {editingCategory ? (
          <BudgetEditor
            category={editingCategory}
            budgetCents={state.budgets[editingId] ?? null}
            currency={currency}
            onSave={save}
            onClear={clear}
            onCancel={() => setEditingId(null)}
          />
        ) : null}
      </Modal>
    </div>
  )
}
