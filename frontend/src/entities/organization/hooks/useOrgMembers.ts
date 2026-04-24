import { useAuthQuery } from '@/shared/auth/useAuthQuery'
import { qk } from '@/shared/api/queryKeys'
import { listOrgMembers, type OrgMemberDto } from '../api'

export function useOrgMembers(organizationId: number) {
  return useAuthQuery<OrgMemberDto[]>(qk.orgMembers(organizationId), (token) =>
    listOrgMembers(organizationId, token),
  )
}
