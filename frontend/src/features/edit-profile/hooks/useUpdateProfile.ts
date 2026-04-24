import { useAuthMutation } from '@/shared/auth/useAuthMutation'
import { qk } from '@/shared/api/queryKeys'
import { updateUser, type UserDto } from '@/entities/user/api'

export function useUpdateProfile(userId: number) {
  return useAuthMutation<{ name: string; phone: string }, UserDto>({
    mutationFn: ({ name, phone }, token) =>
      updateUser(userId, { name, phone: phone || null }, token),
    invalidateKeys: [qk.currentUser()],
    successMessage: 'Profil oppdatert',
    errorMessage: 'Kunne ikke oppdatere profilen',
  })
}
