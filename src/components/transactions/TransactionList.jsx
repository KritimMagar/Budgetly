import TransactionRow from './TransactionRow.jsx'
import { findCategory } from '../../domain/categories.js'

export default function TransactionList({ transactions, categories, currency, theme, onEdit }) {
  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {transactions.map((transaction) => (
        <TransactionRow
          key={transaction.id}
          transaction={transaction}
          category={findCategory(categories, transaction.categoryId)}
          currency={currency}
          theme={theme}
          onEdit={onEdit}
        />
      ))}
    </ul>
  )
}
