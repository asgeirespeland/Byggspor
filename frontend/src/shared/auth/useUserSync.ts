/**
 * Fetches /users/me and the user's organization after Clerk auth is ready, returning a
 * discriminated-union SyncState ({ status: 'loading' | 'error' | 'ready' }).
 */
import { useAuth } from '@clerk/react'
import { getOrganization, type OrgDto } from '@/entities/organization'
import { apiRequest } from '@/shared/api/client'
import { qk } from '@/shared/api/queryKeys'
import { useAuthQuery } from '@/shared/auth/useAuthQuery'

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

export function useUserSync(): SyncState {
  const { isLoaded, isSignedIn } = useAuth()
  const userQuery = useAuthQuery<UserMe>(
    qk.currentUser(),
    (token) => getUserMe(token),
    { enabled: isLoaded && isSignedIn },
  )

  const organizationId = userQuery.data?.organization_id ?? null
  const organizationQuery = useAuthQuery<OrgDto>(
    qk.organization(organizationId ?? 0),
    (token) => getOrganization(organizationId as number, token),
    {
      enabled:
        isLoaded &&
        isSignedIn &&
        userQuery.status === 'success' &&
        typeof organizationId === 'number',
    },
  )

  if (!isLoaded || (isSignedIn && userQuery.isPending)) {
    return { status: 'loading' }
  }

  if (userQuery.isError) {
    return {
      status: 'error',
      message:
        userQuery.error instanceof Error
          ? userQuery.error.message
          : 'Klarte ikke synkronisere brukerprofil',
    }
  }

  if (typeof organizationId === 'number' && organizationQuery.isPending) {
    return { status: 'loading' }
  }

  if (organizationQuery.isError) {
    return {
      status: 'error',
      message:
        organizationQuery.error instanceof Error
          ? organizationQuery.error.message
          : 'Klarte ikke hente organisasjonen',
    }
  }

  return {
    status: 'ready',
    organizationId,
    organization:
      typeof organizationId === 'number' ? organizationQuery.data! : null,
  }
}
