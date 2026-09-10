import { useState } from 'react'
import Button from '../ui/Button.jsx'
import Field, { controlClass, controlErrorClass } from '../ui/Field.jsx'
import { MAX_CATEGORY_NAME, validateCategoryName } from '../../domain/categories.js'

/**
 * Adds or renames one category, and deletes it after saying how many
 * transactions the deletion would move.
 */
export default function CategoryEditor({
  category = null,
  kind,
  categories,
  canDelete = true,
  usageCount = 0,
  fallbackName,
  onSubmit,
  onDelete,
  onCancel,
}) {
  const [name, setName] = useState(category?.name ?? '')
  const [error, setError] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    const result = validateCategoryName(name, categories, { kind, excludeId: category?.id ?? null })
    if (!result.ok) {
      setError(result.error)
      return
    }
    onSubmit(result.name)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field label={kind === 'income' ? 'Income category name' : 'Expense category name'} error={error}>
        {(props) => (
          <input
            {...props}
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setError(null)
            }}
            type="text"
            maxLength={MAX_CATEGORY_NAME}
            autoComplete="off"
            autoFocus
            className={`${controlClass} ${error ? controlErrorClass : ''}`}
          />
        )}
      </Field>

      {confirmingDelete ? (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 dark:border-rose-900 dark:bg-rose-950/40">
          <p className="text-sm text-rose-700 dark:text-rose-300">
            {usageCount === 0
              ? `Delete ${category.name}?`
              : `Delete ${category.name}? ${usageCount} ${usageCount === 1 ? 'transaction moves' : 'transactions move'} to ${fallbackName}.`}
          </p>
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
        <div className="flex items-center gap-2">
          <Button type="submit" className="flex-1">
            {category ? 'Save name' : 'Add category'}
          </Button>
          {category && canDelete ? (
            <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
              Delete
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
