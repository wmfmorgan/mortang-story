import { createContext, useContext } from 'react'
import type { Family, Person } from '../types/database'

export type AppState = {
  person: Person
  family: Family
  setPerson: (person: Person) => void
  signOut: () => Promise<void>
}

const AppContext = createContext<AppState | null>(null)

export const AppProvider = AppContext.Provider

export function useApp() {
  const value = useContext(AppContext)
  if (!value) {
    throw new Error('useApp must be used inside the signed-in shell')
  }
  return value
}
