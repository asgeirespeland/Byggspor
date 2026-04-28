/**
 * Fetches /users/me and the user's organization after Clerk auth is ready, returning a
 * discriminated-union SyncState ({ status: 'loading' | 'error' | 'ready' }). App root uses the
 * ready state to populate AppContext. Bypasses React Query because it runs before the provider
 * is populated.
 */
import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/react'
import { useLocation } from 'react-router-dom'
import { apiRequest } from '@/shared/api/client'
import { getOrganization, type OrgDto } from '@/entities/organization'

type UserMe = {
  id: number
  organization_id: number | null
}

function getUserMe(token: string): Promise<UserMe> {
  return apiRequest<UserMe>('/users/me', { token })
}

export type SyncState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      organizationId: number | null
      organization: OrgDto | null
    }

/**
 * Fetches the current user profile and their organization (if any)
 * after Clerk auth is ready. Returns a discriminated-union state.
 */
export function useUserSync(): SyncState {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth()
  const location = useLocation()
  const isOnboardingRoute = location.pathname === '/onboarding'
  const [sync, setSync] = useState<SyncState>({ status: 'loading' })

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn || !userId) {
      setSync({ status: 'loading' })
      return
    }

    let cancelled = false

    async function run() {
      setSync({ status: 'loading' })
      try {
        const token = await getToken()
        if (!token) throw new Error('Ikke autentisert')

        const user = await getUserMe(token)
        if (cancelled) return

        let organization: OrgDto | null = null
        if (user.organization_id) {
          organization = await getOrganization(user.organization_id, token)
          if (cancelled) return
        }

        setSync({
          status: 'ready',
          organizationId: user.organization_id,
          organization,
        })
      } catch (err) {
        if (cancelled) return
        setSync({
          status: 'error',
          message:
            err instanceof Error
              ? err.message
              : 'Klarte ikke synkronisere brukerprofil',
        })
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, userId, isOnboardingRoute]) // eslint-disable-line react-hooks/exhaustive-deps

  return sync
}
