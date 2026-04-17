import { useAuthQuery } from '@/shared/hooks/useAuthQuery'
import { useAuthMutation } from '@/shared/hooks/useAuthMutation'
import { apiRequest } from '@/shared/api/client'
import type { OrgMemberDto } from '@/shared/types'

export function useOrgMembers(organizationId: number) {
  return useAuthQuery<OrgMemberDto[]>(
    ['organizations', organizationId, 'members'],
    (token) =>
      apiRequest<OrgMemberDto[]>(`/organizations/${organizationId}/members`, {
        token,
      }),
  )
}

export function useAddMember(organizationId: number) {
  return useAuthMutation<{ userId: string; role: string }>({
    mutationFn: ({ userId, role }, token) =>
      apiRequest(`/organizations/${organizationId}/members`, {
        method: 'POST',
        token,
        body: { user_id: Number(userId), role },
      }),
    invalidateKeys: [['organizations', organizationId, 'members']],
  })
}
