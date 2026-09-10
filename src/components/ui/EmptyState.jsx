export default function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-10 text-center dark:border-zinc-800">
      <p className="font-medium text-zinc-700 dark:text-zinc-200">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}
