import { useAuth } from '@clerk/react'
import { useCallback } from 'react'
import { getTokenOrThrow } from '@/shared/auth/getToken'

export function useRequireToken() {
  const { isLoaded, isSignedIn, getToken } = useAuth()

  const authReady = isLoaded && isSignedIn

  const requireToken = useCallback(() => getTokenOrThrow(getToken), [getToken])

  return { authReady, requireToken }
}
