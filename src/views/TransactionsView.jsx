import { useMemo, useState } from 'react'
import Button from '../components/ui/Button.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Modal from '../components/ui/Modal.jsx'
import TransactionForm from '../components/transactions/TransactionForm.jsx'
import TransactionList from '../components/transactions/TransactionList.jsx'
import { sortTransactions } from '../domain/transactions.js'
import { addTransaction, deleteTransaction, updateTransaction } from '../state/actions.js'
import { useStore } from '../state/hooks.js'

export default function TransactionsView() {
  const { state, dispatch } = useStore()
  const [editor, setEditor] = useState(null)

  const transactions = useMemo(() => sortTransactions(state.transactions), [state.transactions])
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

      {transactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Add your first income or expense to start tracking."
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
