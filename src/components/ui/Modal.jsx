import { useEffect, useRef } from 'react'

/**
 * Wraps the native <dialog>, which gives focus trapping, Escape handling and
 * inertness of the page behind it without any extra code.
 */
export default function Modal({ open, title, onClose, children }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        // The dialog element itself is the backdrop area around the panel.
        if (event.target === ref.current) onClose()
      }}
      className="m-auto w-[calc(100%-1.5rem)] max-w-md rounded-2xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-zinc-950/60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
    >
      {open ? (
        <div className="max-h-[85dvh] overflow-y-auto p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  )
}
