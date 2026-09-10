/**
 * App bar. `actions` is a slot for controls that belong to the current view
 * (the month switcher lands here in a later step).
 */
export default function Header({ actions }) {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500 text-sm font-bold text-zinc-950"
          >
            B
          </span>
          <h1 className="text-base font-semibold tracking-tight">Budgetly</h1>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
