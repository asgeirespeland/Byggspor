import { useAuth } from '@clerk/react'
import { useCallback } from 'react'

export function useRequireToken() {
  const { isLoaded, isSignedIn, getToken } = useAuth()

  const authReady = isLoaded && isSignedIn

  const requireToken = useCallback(async (): Promise<string> => {
    const token = await getToken()
    if (!token) throw new Error('Ikke autentisert')
    return token
  }, [getToken])

  return { authReady, requireToken }
}
