import { removeOrgMember } from '@/entities/organization'
import { qk } from '@/shared/api/queryKeys'
import { useAuthMutation } from '@/shared/auth/useAuthMutation'

export function useRemoveMember(organizationId: number | null) {
  return useAuthMutation<{ userId: number }>({
    mutationFn: ({ userId }, token) =>
      removeOrgMember(organizationId as number, userId, token),
    invalidateKeys: [qk.orgMembers(organizationId)],
    successMessage: 'Medlemmet ble fjernet',
    errorMessage: 'Kunne ikke fjerne medlemmet',
  })
}
