import { useAuth } from '@clerk/react'
import { useAuthQuery } from '@/shared/hooks/useAuthQuery'
import { useAuthMutation } from '@/shared/hooks/useAuthMutation'
import { apiRequest } from '@/shared/api/client'
import { qk } from '@/shared/api/queryKeys'
import type { UserDto } from '@/shared/types'

export function useCurrentUser() {
  const { isLoaded, isSignedIn } = useAuth()

  return useAuthQuery<UserDto>(
    qk.currentUser(),
    (token) => apiRequest<UserDto>('/users/me', { token }),
    { enabled: isLoaded && isSignedIn },
  )
}

export function useUpdateProfile(userId: number) {
  return useAuthMutation<{ name: string; phone: string }, UserDto>({
    mutationFn: ({ name, phone }, token) =>
      apiRequest<UserDto>(`/users/${userId}`, {
        method: 'PATCH',
        token,
        body: { name, phone: phone || null },
      }),
    invalidateKeys: [qk.currentUser()],
    successMessage: 'Profil oppdatert',
    errorMessage: 'Kunne ikke oppdatere profilen',
  })
}
