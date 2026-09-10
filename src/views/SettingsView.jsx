import { useMemo } from 'react'
import CategoryManager from '../components/settings/CategoryManager.jsx'
import CurrencySetting from '../components/settings/CurrencySetting.jsx'
import DataTransfer from '../components/settings/DataTransfer.jsx'
import SegmentedControl from '../components/ui/SegmentedControl.jsx'
import { addCategory, deleteCategory, renameCategory, replaceState, updateSettings } from '../state/actions.js'
import { useStore } from '../state/hooks.js'
import { mergeImport } from '../domain/csv.js'

const THEMES = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
]

export default function SettingsView() {
  const { state, dispatch, storageFailed } = useStore()

  // How many transactions each category holds, for the delete confirmation.
  const usageCounts = useMemo(() => {
    const counts = {}
    for (const transaction of state.transactions) {
      counts[transaction.categoryId] = (counts[transaction.categoryId] ?? 0) + 1
    }
    return counts
  }, [state.transactions])

  const managerProps = {
    categories: state.categories,
    usageCounts,
    theme: state.settings.theme,
    onAdd: (name, kind) => dispatch(addCategory(name, kind)),
    onRename: (id, name) => dispatch(renameCategory(id, name)),
    onDelete: (id, reassignTo) => dispatch(deleteCategory(id, reassignTo)),
  }

  return (
    <div className="space-y-4">
      {storageFailed ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          This browser is refusing to save data, so changes will be lost when you close the tab.
        </p>
      ) : null}

      <CurrencySetting
        currency={state.settings.currency}
        onChange={(currency) => dispatch(updateSettings({ currency }))}
      />

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-semibold">Appearance</h2>
        <p className="mt-0.5 mb-3 text-sm text-zinc-500 dark:text-zinc-400">
          Category colours have their own shade for each theme.
        </p>
        <SegmentedControl
          label="Theme"
          value={state.settings.theme}
          options={THEMES}
          onChange={(theme) => dispatch(updateSettings({ theme }))}
        />
      </section>

      <CategoryManager
        kind="expense"
        title="Expense categories"
        description="Where your spending is filed."
        {...managerProps}
      />

      <DataTransfer
        state={state}
        onImport={(result, options) => dispatch(replaceState(mergeImport(state, result, options)))}
      />

      <CategoryManager
        kind="income"
        title="Income categories"
        description="Kept separate from spending."
        {...managerProps}
      />
    </div>
  )
}
