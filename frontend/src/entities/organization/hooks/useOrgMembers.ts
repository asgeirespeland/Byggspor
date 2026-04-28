import { useAuthQuery } from '@/shared/auth/useAuthQuery'
import { qk } from '@/shared/api/queryKeys'
import { listOrgMembers, type OrgMemberDto } from '../api'

export function useOrgMembers(organizationId: number | null) {
  return useAuthQuery<OrgMemberDto[]>(
    qk.orgMembers(organizationId),
    (token) => listOrgMembers(organizationId as number, token),
    { enabled: typeof organizationId === 'number' },
  )
}
