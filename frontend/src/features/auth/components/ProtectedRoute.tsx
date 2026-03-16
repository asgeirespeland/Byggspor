import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { apiRequest } from '../../../shared/api/client'

type UserMe = {
  id: number
  organization_id: number | null
}

type SyncState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; organizationId: number | null }

export default function ProtectedRoute() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth()
  const location = useLocation()
  const [sync, setSync] = useState<SyncState>({ status: 'loading' })

  // Re-run from scratch whenever the signed-in user changes
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

        setSync({ status: 'ready', organizationId: user.organization_id })
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

  // Clerk still initializing
  if (!isLoaded) {
    return <Loader text="Laster autentisering…" />
  }

  // Not signed in
  if (!isSignedIn) {
    return (
      <Navigate
        to="/sign-in"
        replace
        state={{
          from: `${location.pathname}${location.search}${location.hash}`,
        }}
      />
    )
  }

  // Fetching user profile
  if (sync.status === 'loading') {
    return <Loader text="Synkroniserer brukerprofil…" />
  }

  // Fetch failed
  if (sync.status === 'error') {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <div className="max-w-md rounded border border-red-300 bg-red-50 p-4 text-red-800">
          <p className="text-sm">{sync.message}</p>
          <button
            type="button"
            className="mt-3 rounded border border-red-400 px-3 py-2 text-sm"
            onClick={() => setSync({ status: 'loading' })}
          >
            Prøv igjen
          </button>
        </div>
      </div>
    )
  }

  // No org yet — force onboarding
  if (sync.organizationId === null && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}

function Loader({ text }: { text: string }) {
  return (
    <div className="min-h-screen grid place-items-center text-gray-600">
      {text}
    </div>
  )
}
