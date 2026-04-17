import { useAuthQuery } from '@/shared/auth/useAuthQuery'
import { useAuthMutation } from '@/shared/auth/useAuthMutation'
import { qk } from '@/shared/api/queryKeys'
import { addOrgMember, listOrgMembers, type OrgMemberDto } from '../api'

export function useOrgMembers(organizationId: number) {
  return useAuthQuery<OrgMemberDto[]>(qk.orgMembers(organizationId), (token) =>
    listOrgMembers(organizationId, token),
  )
}

export function useAddMember(organizationId: number) {
  return useAuthMutation<{ userId: string; role: string }>({
    mutationFn: ({ userId, role }, token) =>
      addOrgMember(organizationId, { user_id: Number(userId), role }, token),
    invalidateKeys: [qk.orgMembers(organizationId)],
  })
}
