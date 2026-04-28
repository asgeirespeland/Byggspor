/**
 * Authentication + user-sync gate for private routes.
 */
import { useAuth } from '@clerk/react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AppProvider } from '@/shared/context/AppContext'
import { useUserSync } from '@/shared/auth/useUserSync'

export default function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth()
  const location = useLocation()
  const sync = useUserSync()

  if (!isLoaded) {
    return <Loader text="Laster autentisering..." />
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

  if (sync.status === 'loading') {
    return <Loader text="Synkroniserer brukerprofil..." />
  }

  if (sync.status === 'error') {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <div className="max-w-md rounded border border-danger/30 bg-danger-soft p-4 text-danger-strong">
          <p className="text-sm">{sync.message}</p>
        </div>
      </div>
    )
  }

  return (
    <AppProvider
      value={{
        organizationId: sync.organizationId,
        organization: sync.organization,
      }}
    >
      <Outlet />
    </AppProvider>
  )
}

function Loader({ text }: { text: string }) {
  return (
    <div className="min-h-screen grid place-items-center text-muted-foreground">
      {text}
    </div>
  )
}
