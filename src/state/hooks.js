import { useContext } from 'react'
import { StoreContext } from './StoreProvider.jsx'

export function useStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore must be used inside <StoreProvider>')
  return store
}

export function useDispatch() {
  return useStore().dispatch
}

export function useSettings() {
  return useStore().state.settings
}

export function useCurrency() {
  return useStore().state.settings.currency
}

export function useCategories() {
  return useStore().state.categories
}

export function useTransactions() {
  return useStore().state.transactions
}

export function useBudgets() {
  return useStore().state.budgets
}
