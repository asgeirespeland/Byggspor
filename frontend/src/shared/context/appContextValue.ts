import { createContext } from 'react'
import type { OrgDto } from '@/entities/organization'

export type AppContextValue = {
  organizationId: number
  organization: OrgDto | null
}

export const AppContext = createContext<AppContextValue | null>(null)
