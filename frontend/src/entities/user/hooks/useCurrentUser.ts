import { useAuth } from '@clerk/react'
import { useAuthQuery } from '@/shared/auth/useAuthQuery'
import { useAuthMutation } from '@/shared/auth/useAuthMutation'
import { qk } from '@/shared/api/queryKeys'
import { getCurrentUser, updateUser, type UserDto } from '../api'

export function useCurrentUser() {
  const { isLoaded, isSignedIn } = useAuth()

  return useAuthQuery<UserDto>(
    qk.currentUser(),
    (token) => getCurrentUser(token),
    { enabled: isLoaded && isSignedIn },
  )
}

export function useUpdateProfile(userId: number) {
  return useAuthMutation<{ name: string; phone: string }, UserDto>({
    mutationFn: ({ name, phone }, token) =>
      updateUser(userId, { name, phone: phone || null }, token),
    invalidateKeys: [qk.currentUser()],
    successMessage: 'Profil oppdatert',
    errorMessage: 'Kunne ikke oppdatere profilen',
  })
}
