import { useId } from 'react'

/** Shared control styling, so inputs and selects match without a wrapper each. */
export const controlClass =
  'w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500'

export const controlErrorClass =
  'border-rose-500 focus:border-rose-500 focus:ring-rose-500/30 dark:border-rose-500'

/**
 * Label, control and error message wired together. `children` is a render prop
 * so the control receives the generated id and aria attributes.
 */
export default function Field({ label, error, hint, children }) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? errorId : hint ? hintId : undefined,
      })}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-sm text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
