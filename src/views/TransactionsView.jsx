import { useMemo, useState } from 'react'
import Button from '../components/ui/Button.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Modal from '../components/ui/Modal.jsx'
import TransactionForm from '../components/transactions/TransactionForm.jsx'
import TransactionList from '../components/transactions/TransactionList.jsx'
import { EMPTY_FILTERS, filterTransactions, isFilterActive, sortTransactions } from '../domain/transactions.js'
import { findCategory } from '../domain/categories.js'
import { formatMonthLabel, monthOf } from '../domain/dates.js'
import { addTransaction, deleteTransaction, updateTransaction } from '../state/actions.js'
import { useStore } from '../state/hooks.js'

export default function TransactionsView({ filters = EMPTY_FILTERS, onFiltersChange }) {
  const { state, dispatch } = useStore()
  const [editor, setEditor] = useState(null)

  const transactions = useMemo(
    () =>
      sortTransactions(
        filterTransactions(state.transactions, filters, { categories: state.categories }),
      ),
    [state.transactions, state.categories, filters],
  )

  const filtered = isFilterActive(filters)
  const filterLabels = [
    filters.categoryId !== 'all' ? findCategory(state.categories, filters.categoryId)?.name : null,
    // A from/to covering one whole month reads as that month.
    filters.from && filters.to && monthOf(filters.from) === monthOf(filters.to)
      ? formatMonthLabel(monthOf(filters.from))
      : null,
  ].filter(Boolean)
  const editing = editor?.id ? state.transactions.find((t) => t.id === editor.id) : null

  const close = () => setEditor(null)

  function handleSubmit(value) {
    dispatch(editing ? updateTransaction(editing.id, value) : addTransaction(value))
    close()
  }

  function handleDelete() {
    dispatch(deleteTransaction(editing.id))
    close()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}
        </p>
        <Button size="sm" onClick={() => setEditor({ id: null })}>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add
        </Button>
      </div>

      {filtered ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="min-w-0 truncate text-sm text-zinc-600 dark:text-zinc-300">
            Showing {filterLabels.join(' · ') || 'a filtered list'}
          </p>
          <button
            type="button"
            onClick={() => onFiltersChange?.(EMPTY_FILTERS)}
            className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
          >
            Clear
          </button>
        </div>
      ) : null}

      {transactions.length === 0 ? (
        <EmptyState
          title={filtered ? 'Nothing matches' : 'No transactions yet'}
          description={
            filtered
              ? 'No transactions in this category for this month.'
              : 'Add your first income or expense to start tracking.'
          }
          action={<Button onClick={() => setEditor({ id: null })}>Add transaction</Button>}
        />
      ) : (
        <TransactionList
          transactions={transactions}
          categories={state.categories}
          currency={state.settings.currency}
          theme={state.settings.theme}
          onEdit={(transaction) => setEditor({ id: transaction.id })}
        />
      )}

      <Modal
        open={editor !== null}
        title={editing ? 'Edit transaction' : 'New transaction'}
        onClose={close}
      >
        <TransactionForm
          transaction={editing}
          categories={state.categories}
          currency={state.settings.currency}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          onCancel={close}
        />
      </Modal>
    </div>
  )
}
