import { createContext, useEffect, useMemo, useReducer, useState } from 'react'
import { loadState, saveState } from './persistence.js'
import { reducer } from './reducer.js'

export const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const [storageFailed, setStorageFailed] = useState(false)

  useEffect(() => {
    // Runs on mount too, so anything normalizeState had to repair is written back.
    setStorageFailed(!saveState(state))
  }, [state])

  useEffect(() => {
    const isDark = state.settings.theme === 'dark'
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
  }, [state.settings.theme])

  const value = useMemo(() => ({ state, dispatch, storageFailed }), [state, storageFailed])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
