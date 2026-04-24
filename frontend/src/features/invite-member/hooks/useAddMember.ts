import { useAuthMutation } from '@/shared/auth/useAuthMutation'
import { qk } from '@/shared/api/queryKeys'
import { addOrgMember } from '@/entities/organization/api'

export function useAddMember(organizationId: number) {
  return useAuthMutation<{ userId: string; role: string }>({
    mutationFn: ({ userId, role }, token) =>
      addOrgMember(organizationId, { user_id: Number(userId), role }, token),
    invalidateKeys: [qk.orgMembers(organizationId)],
  })
}
