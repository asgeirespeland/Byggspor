import type { AppContextValue } from './appContextValue'
import { AppContext } from './appContextValue'

export function AppProvider({
  value,
  children,
}: {
  value: AppContextValue
  children: React.ReactNode
}) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
