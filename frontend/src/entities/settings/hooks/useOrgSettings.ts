import { useAuthQuery } from '@/shared/auth/useAuthQuery'
import { qk } from '@/shared/api/queryKeys'
import { getOrgSettings } from '../api'

export function useOrgSettings(orgId: number | undefined) {
  return useAuthQuery(
    qk.orgSettings(orgId),
    (token) => getOrgSettings(orgId!, token),
    { enabled: orgId != null },
  )
}
