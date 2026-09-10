import { useState } from 'react'
import Button from '../ui/Button.jsx'
import Modal from '../ui/Modal.jsx'
import CategoryEditor from './CategoryEditor.jsx'
import { categoriesOfKind, fallbackCategoryId, findCategory, isFallbackCategory } from '../../domain/categories.js'
import { colorFor } from '../../domain/palette.js'

/**
 * One list per kind. Income and expense categories are managed apart, so
 * neither list can be reordered or edited into the other.
 */
export default function CategoryManager({
  kind,
  title,
  description,
  categories,
  usageCounts,
  theme,
  onAdd,
  onRename,
  onDelete,
}) {
  const [editing, setEditing] = useState(null)

  const rows = categoriesOfKind(categories, kind)
  const category = editing?.id ? findCategory(categories, editing.id) : null
  const fallbackName = findCategory(categories, fallbackCategoryId(kind))?.name ?? 'Other'
  const close = () => setEditing(null)

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
          ) : null}
        </div>
        <Button size="sm" variant="secondary" onClick={() => setEditing({ id: null })}>
          <span aria-hidden="true" className="text-base leading-none">+</span>
          Add
        </Button>
      </div>

      <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => setEditing({ id: row.id })}
              className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
            >
              <span
                aria-hidden="true"
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: colorFor(row.colorKey, theme) }}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{row.name}</span>
              <span className="shrink-0 text-xs tabular text-zinc-500 dark:text-zinc-400">
                {usageCounts[row.id] ?? 0}
              </span>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.5 5.5L16 12l-6.5 6.5" />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      <Modal
        open={editing !== null}
        title={category ? 'Edit category' : `New ${kind} category`}
        onClose={close}
      >
        <CategoryEditor
          category={category}
          kind={kind}
          categories={categories}
          canDelete={category ? !isFallbackCategory(category.id) : false}
          usageCount={category ? (usageCounts[category.id] ?? 0) : 0}
          fallbackName={fallbackName}
          onSubmit={(name) => {
            if (category) onRename(category.id, name)
            else onAdd(name, kind)
            close()
          }}
          onDelete={() => {
            onDelete(category.id, fallbackCategoryId(kind))
            close()
          }}
          onCancel={close}
        />
      </Modal>
    </section>
  )
}
