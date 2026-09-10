/**
 * Radio group styled as a segment bar. Options may carry their own active
 * classes when the choice has a meaning worth colouring (income vs expense).
 */
export default function SegmentedControl({ label, value, options, onChange }) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
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
                ? (option.activeClass ?? 'bg-white text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100')
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
