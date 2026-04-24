import { useAuth } from '@clerk/react'
import { useAuthQuery } from '@/shared/auth/useAuthQuery'
import { qk } from '@/shared/api/queryKeys'
import { getCurrentUser, type UserDto } from '../api'

export function useCurrentUser() {
  const { isLoaded, isSignedIn } = useAuth()

  return useAuthQuery<UserDto>(
    qk.currentUser(),
    (token) => getCurrentUser(token),
    { enabled: isLoaded && isSignedIn },
  )
}
