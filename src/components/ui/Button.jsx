const VARIANTS = {
  primary:
    'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 focus-visible:outline-emerald-400',
  secondary:
    'border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 focus-visible:outline-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800',
  ghost:
    'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-zinc-400 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
  danger:
    'border border-rose-300 text-rose-600 hover:bg-rose-50 focus-visible:outline-rose-400 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/50',
}

const SIZES = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  )
}
