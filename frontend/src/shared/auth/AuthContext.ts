import { createContext } from 'react'

export type AuthContextValue = {
  token: string
  setToken: (token: string) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
