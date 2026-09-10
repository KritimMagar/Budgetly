const ICONS = {
  month: (
    <>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
    </>
  ),
  transactions: (
    <>
      <path d="M4 6.5h11M4 12h16M4 17.5h11" />
      <path d="M18 4.5l2.5 2-2.5 2M18 15.5l2.5 2-2.5 2" />
    </>
  ),
  budgets: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.5" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2.2" />
      <circle cx="8" cy="17" r="2.2" />
    </>
  ),
}

/**
 * Bottom bar on phones, a row under the header from `md` up. Rendered once so
 * assistive tech sees a single navigation landmark.
 */
export default function TabBar({ tabs, activeId, onChange }) {
  return (
    <nav
      aria-label="Views"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-zinc-800 dark:bg-zinc-950 md:static md:border-t-0 md:border-b md:bg-transparent dark:md:bg-transparent"
    >
      <ul className="mx-auto flex max-w-3xl md:gap-1 md:px-4">
        {tabs.map((tab) => {
          const active = tab.id === activeId
          return (
            <li key={tab.id} className="flex-1 md:flex-none">
              <button
                type="button"
                onClick={() => onChange(tab.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex w-full flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors md:flex-row md:gap-2 md:px-3 md:py-2 md:text-sm ${
                  active
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {ICONS[tab.id]}
                </svg>
                {tab.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
