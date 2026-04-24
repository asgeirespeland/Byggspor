import { useAuthQuery } from '@/shared/auth/useAuthQuery'
import { qk } from '@/shared/api/queryKeys'
import { getOrganization, type OrgDto } from '../api'

export function useOrganization(id: number | null | undefined) {
  return useAuthQuery<OrgDto>(
    qk.organization(id ?? 0),
    (token) => getOrganization(id as number, token),
    { enabled: typeof id === 'number' },
  )
}
