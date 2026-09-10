import { useState } from 'react'
import Button from '../ui/Button.jsx'
import Field, { controlClass, controlErrorClass } from '../ui/Field.jsx'
import { centsToDecimalString, currencySymbol, parseAmount } from '../../domain/money.js'

/**
 * Sets or clears the monthly limit for one category. The same parseAmount rules
 * as transactions apply, so a budget can never be zero or negative.
 */
export default function BudgetEditor({ category, budgetCents, currency, onSave, onClear, onCancel }) {
  const [amount, setAmount] = useState(budgetCents ? centsToDecimalString(budgetCents) : '')
  const [error, setError] = useState(null)

  function handleSubmit(event) {
    event.preventDefault()
    const result = parseAmount(amount)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onSave(result.cents)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field
        label={`Monthly budget for ${category.name}`}
        error={error}
        hint="Applies to every month until you change it."
      >
        {(props) => (
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-zinc-500 dark:text-zinc-400">
              {currencySymbol(currency)}
            </span>
            <input
              {...props}
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value)
                setError(null)
              }}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              autoFocus
              className={`${controlClass} pl-9 tabular ${error ? controlErrorClass : ''}`}
            />
          </div>
        )}
      </Field>

      <div className="flex items-center gap-2">
        <Button type="submit" className="flex-1">
          {budgetCents ? 'Update budget' : 'Set budget'}
        </Button>
        {budgetCents ? (
          <Button variant="danger" onClick={onClear}>
            Remove
          </Button>
        ) : (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
