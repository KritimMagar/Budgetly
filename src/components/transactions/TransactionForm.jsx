import { useState } from 'react'
import Button from '../ui/Button.jsx'
import Field, { controlClass, controlErrorClass } from '../ui/Field.jsx'
import TypeToggle from './TypeToggle.jsx'
import { centsToDecimalString, currencySymbol } from '../../domain/money.js'
import { todayISO } from '../../domain/dates.js'
import { validateTransaction } from '../../domain/transactions.js'
import { categoriesOfKind, findCategory } from '../../domain/categories.js'

function firstCategoryId(categories, kind) {
  return categoriesOfKind(categories, kind)[0]?.id ?? ''
}

function draftFrom(transaction, fallbackDate) {
  if (!transaction) {
    return { amount: '', type: 'expense', categoryId: '', date: fallbackDate, note: '' }
  }
  return {
    amount: centsToDecimalString(transaction.amountCents),
    type: transaction.type,
    categoryId: transaction.categoryId,
    date: transaction.date,
    note: transaction.note ?? '',
  }
}

/**
 * Add and edit share one form. Validation lives in the domain layer; this
 * component only renders the errors it hands back.
 */
export default function TransactionForm({
  transaction = null,
  categories,
  currency,
  defaultDate = todayISO(),
  onSubmit,
  onDelete,
  onCancel,
}) {
  const [draft, setDraft] = useState(() => {
    const initial = draftFrom(transaction, defaultDate)
    if (initial.categoryId) return initial
    return { ...initial, categoryId: firstCategoryId(categories, initial.type) }
  })
  const [errors, setErrors] = useState({})
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  // Only the categories belonging to the chosen type are ever offered.
  const options = categoriesOfKind(categories, draft.type)

  const set = (field) => (value) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors(({ [field]: _cleared, ...rest }) => rest)
  }

  function handleTypeChange(type) {
    setDraft((current) => {
      const stillValid = findCategory(categories, current.categoryId)?.kind === type
      return {
        ...current,
        type,
        categoryId: stillValid ? current.categoryId : firstCategoryId(categories, type),
      }
    })
    setErrors(({ type: _t, categoryId: _c, ...rest }) => rest)
  }

  function handleSubmit(event) {
    event.preventDefault()
    const result = validateTransaction(draft, { categories })
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    onSubmit(result.value)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <TypeToggle value={draft.type} onChange={handleTypeChange} />

      <Field label="Amount" error={errors.amount}>
        {(props) => (
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-zinc-500 dark:text-zinc-400">
              {currencySymbol(currency)}
            </span>
            <input
              {...props}
              value={draft.amount}
              onChange={(event) => set('amount')(event.target.value)}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              autoFocus
              className={`${controlClass} pl-9 tabular ${errors.amount ? controlErrorClass : ''}`}
            />
          </div>
        )}
      </Field>

      <Field label={draft.type === 'income' ? 'Income category' : 'Expense category'} error={errors.categoryId}>
        {(props) => (
          <select
            {...props}
            value={draft.categoryId}
            onChange={(event) => set('categoryId')(event.target.value)}
            className={`${controlClass} ${errors.categoryId ? controlErrorClass : ''}`}
          >
            {options.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field label="Date" error={errors.date}>
        {(props) => (
          <input
            {...props}
            value={draft.date}
            onChange={(event) => set('date')(event.target.value)}
            type="date"
            className={`${controlClass} ${errors.date ? controlErrorClass : ''}`}
          />
        )}
      </Field>

      <Field label="Note" error={errors.note} hint="Optional">
        {(props) => (
          <input
            {...props}
            value={draft.note}
            onChange={(event) => set('note')(event.target.value)}
            type="text"
            maxLength={140}
            placeholder="What was it for?"
            className={`${controlClass} ${errors.note ? controlErrorClass : ''}`}
          />
        )}
      </Field>

      {confirmingDelete ? (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 dark:border-rose-900 dark:bg-rose-950/40">
          <p className="text-sm text-rose-700 dark:text-rose-300">Delete this transaction?</p>
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setConfirmingDelete(false)}>
              Keep it
            </Button>
            <Button variant="danger" size="sm" onClick={onDelete}>
              Delete
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 pt-1">
          <Button type="submit" className="flex-1">
            {transaction ? 'Save changes' : 'Add transaction'}
          </Button>
          {transaction ? (
            <Button variant="danger" onClick={() => setConfirmingDelete(true)} aria-label="Delete transaction">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 12.5h9l1-12.5M10 10.5v6M14 10.5v6" />
              </svg>
            </Button>
          ) : (
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      )}
    </form>
  )
}
