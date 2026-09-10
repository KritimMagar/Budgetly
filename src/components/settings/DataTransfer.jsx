import { useRef, useState } from 'react'
import Button from '../ui/Button.jsx'
import { toCSV, summarizeImport, transactionsFromCSV } from '../../domain/csv.js'
import { todayISO } from '../../domain/dates.js'

function downloadCSV(text, filename) {
  // The BOM is what makes spreadsheet software read the file as UTF-8.
  const blob = new Blob([`﻿${text}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/**
 * Export writes every transaction; import reads them back, showing what the
 * file would do before anything is changed.
 */
export default function DataTransfer({ state, onImport }) {
  const inputRef = useRef(null)
  const [pending, setPending] = useState(null)
  const [replace, setReplace] = useState(false)
  const [error, setError] = useState(null)

  async function handleFile(event) {
    const file = event.target.files?.[0]
    // Clearing the input lets the same file be picked again after a cancel.
    event.target.value = ''
    if (!file) return

    setError(null)
    try {
      const result = transactionsFromCSV(await file.text(), { categories: state.categories })
      if (result.transactions.length === 0 && result.invalid.length === 0) {
        setError('That file has no transactions in it.')
        return
      }
      setPending({ result, summary: summarizeImport(state, result), name: file.name })
    } catch {
      setError('That file could not be read.')
    }
  }

  function confirmImport() {
    onImport(pending.result, { replace })
    setPending(null)
    setReplace(false)
  }

  const summary = pending?.summary

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="font-semibold">Your data</h2>
      <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
        Everything lives in this browser. Export a copy as CSV, or bring one back.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={state.transactions.length === 0}
          onClick={() =>
            downloadCSV(toCSV(state.transactions, state.categories), `budgetly-${todayISO()}.csv`)
          }
        >
          Export CSV
        </Button>

        <Button variant="secondary" onClick={() => inputRef.current?.click()}>
          Import CSV
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          className="sr-only"
          aria-label="Choose a CSV file to import"
        />
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : null}

      {pending ? (
        <div className="mt-4 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
          <p className="text-sm font-medium">{pending.name}</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
            <li>{summary.added} to add</li>
            <li>{summary.updated} already here, to update</li>
            {summary.newCategories > 0 ? <li>{summary.newCategories} new categories</li> : null}
            {summary.invalid > 0 ? (
              <li className="text-amber-600 dark:text-amber-400">
                {summary.invalid} rows cannot be read and will be skipped
                {pending.result.invalid[0] ? ` — line ${pending.result.invalid[0].line}: ${pending.result.invalid[0].reason}` : ''}
              </li>
            ) : null}
          </ul>

          <label className="mt-3 flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={replace}
              onChange={(event) => setReplace(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
            />
            <span>
              Replace my transactions with this file
              {summary.removedByReplace > 0 ? (
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                  {summary.removedByReplace} not in the file would be removed. Categories, budgets and
                  settings are kept either way.
                </span>
              ) : null}
            </span>
          </label>

          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={confirmImport}>
              Import
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setPending(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
