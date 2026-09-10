import { useState } from 'react'
import Button from '../ui/Button.jsx'
import Field, { controlClass, controlErrorClass } from '../ui/Field.jsx'
import CategoryIcon from '../ui/CategoryIcon.jsx'
import { MAX_CATEGORY_NAME, validateCategoryName } from '../../domain/categories.js'
import { DEFAULT_ICON, ICON_GROUPS } from '../../domain/icons.js'

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
  colorKey,
  theme,
  onSubmit,
  onDelete,
  onCancel,
}) {
  const [name, setName] = useState(category?.name ?? '')
  const [icon, setIcon] = useState(category?.icon ?? DEFAULT_ICON)
  const [error, setError] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    const result = validateCategoryName(name, categories, { kind, excludeId: category?.id ?? null })
    if (!result.ok) {
      setError(result.error)
      return
    }
    onSubmit(result.name, icon)
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

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">Icon</legend>
        <div className="max-h-56 space-y-3 overflow-y-auto rounded-xl border border-zinc-200 p-2 dark:border-zinc-800">
          {ICON_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-1 pb-1 text-xs text-zinc-500 dark:text-zinc-400">{group.label}</p>
              <div className="flex flex-wrap gap-1">
                {group.names.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setIcon(option)}
                    aria-pressed={icon === option}
                    aria-label={option.replace(/-/g, ' ')}
                    className={`grid h-10 w-10 place-items-center rounded-xl border transition-colors ${
                      icon === option
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                        : 'border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <CategoryIcon
                      name={option}
                      colorKey={colorKey ?? category?.colorKey}
                      theme={theme}
                      size={20}
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

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
