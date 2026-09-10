import SegmentedControl from '../ui/SegmentedControl.jsx'

const OPTIONS = [
  { value: 'expense', label: 'Expense', activeClass: 'bg-rose-500 text-white' },
  { value: 'income', label: 'Income', activeClass: 'bg-emerald-500 text-zinc-950' },
]

export default function TypeToggle({ value, onChange }) {
  return (
    <SegmentedControl label="Transaction type" value={value} options={OPTIONS} onChange={onChange} />
  )
}
