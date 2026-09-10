const OPTIONS = [
  { value: 'expense', label: 'Expense', active: 'bg-rose-500 text-white' },
  { value: 'income', label: 'Income', active: 'bg-emerald-500 text-zinc-950' },
]

export default function TypeToggle({ value, onChange, id }) {
  return (
    <div
      id={id}
      role="radiogroup"
      aria-label="Transaction type"
      className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800"
    >
      {OPTIONS.map((option) => {
        const selected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`rounded-lg py-2 text-sm font-medium transition-colors ${
              selected
                ? option.active
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
