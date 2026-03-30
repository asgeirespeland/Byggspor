import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/react'
import { apiRequest } from '@/shared/api/client'
import type { OrgDto } from '@/shared/types'

type UserMe = {
  id: number
  organization_id: number | null
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

        const user = await apiRequest<UserMe>('/users/me', { token })
        if (cancelled) return

        let organization: OrgDto | null = null
        if (user.organization_id) {
          organization = await apiRequest<OrgDto>(
            `/organizations/${user.organization_id}`,
            { token },
          )
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
  }, [isLoaded, isSignedIn, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  return sync
}
