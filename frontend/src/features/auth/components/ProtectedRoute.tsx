import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { apiRequest } from '../../../shared/api/client'

export default function ProtectedRoute() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth()
  const location = useLocation()
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'ready'>(
    'idle',
  )
  const [syncError, setSyncError] = useState('')
  const [syncAttempted, setSyncAttempted] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) {
      setSyncState('idle')
      setSyncError('')
      setSyncAttempted(false)
      return
    }
    if (syncAttempted && retryCount === 0) {
      return
    }

    let cancelled = false

    async function syncUser() {
      setSyncState('syncing')
      setSyncError('')

      try {
        const token = await getToken()
        if (!token) {
          throw new Error('Ikke autentisert')
        }

        await apiRequest('/users/me', { token })
        if (cancelled) return

        setSyncState('ready')
        setSyncAttempted(true)
      } catch (err) {
        if (cancelled) return
        setSyncState('idle')
        setSyncAttempted(true)
        setSyncError(
          err instanceof Error
            ? err.message
            : 'Klarte ikke synkronisere brukerprofil',
        )
      }
    }

    void syncUser()

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, userId, getToken, retryCount, syncAttempted])

  if (!isLoaded) {
    return (
      <div className="min-h-screen grid place-items-center text-gray-600">
        Laster autentisering
      </div>
    )
  }

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

  if (syncState === 'syncing') {
    return (
      <div className="min-h-screen grid place-items-center text-gray-600">
        Synkroniserer brukerprofil
      </div>
    )
  }

  if (syncError) {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <div className="max-w-md rounded border border-red-300 bg-red-50 p-4 text-red-800">
          <p className="text-sm">{syncError}</p>
          <button
            type="button"
            className="mt-3 rounded border border-red-400 px-3 py-2 text-sm"
            onClick={() => setRetryCount((count) => count + 1)}
          >
            Prøv igjen
          </button>
        </div>
      </div>
    )
  }

  return <Outlet />
}
