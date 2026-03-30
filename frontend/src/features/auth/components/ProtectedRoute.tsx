import { useAuth } from '@clerk/react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AppProvider } from '@/shared/context/AppContext'
import { useUserSync } from '@/shared/hooks/useUserSync'

export default function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth()
  const location = useLocation()
  const sync = useUserSync()

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
        </div>
      </div>
    )
  }

  // No org yet — force onboarding
  if (sync.organizationId === null && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <AppProvider
      value={{
        organizationId: sync.organizationId!,
        organization: sync.organization,
      }}
    >
      <Outlet />
    </AppProvider>
  )
}

function Loader({ text }: { text: string }) {
  return (
    <div className="min-h-screen grid place-items-center text-gray-600">
      {text}
    </div>
  )
}
