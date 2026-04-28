/**
 * Authentication + user-sync gate for private routes.
 * Responsibilities:
 *   1. Wait for Clerk to load; redirect to /sign-in if unauthenticated.
 *   2. Run useUserSync to ensure the backend has a row for this user.
 *   3. If the user has no organizationId, force redirect to /onboarding.
 *   4. Allow the onboarding route to render without AppContext.
 *   5. Otherwise provide AppContext (organizationId/organization) to children.
 *
 * Exports: default ProtectedRoute. Local Loader is a small full-screen status helper.
 * Coupling: Clerk useAuth, shared/auth/useUserSync, shared/context/AppContext.
 */
import { useAuth } from '@clerk/react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AppProvider } from '@/shared/context/AppContext'
import { useUserSync } from '@/shared/auth/useUserSync'

const LIMITED_MODE_ALLOWED_PATHS = new Set(['/', '/settings', '/organization'])

function continueWithoutOrgKey(userId: string | null | undefined) {
  return `continueWithoutOrganization:${userId ?? 'anonymous'}`
}

export default function ProtectedRoute() {
  const { isLoaded, isSignedIn, userId } = useAuth()
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
        <div className="max-w-md rounded border border-danger/30 bg-danger-soft p-4 text-danger-strong">
          <p className="text-sm">{sync.message}</p>
        </div>
      </div>
    )
  }

  // No org yet — force onboarding, but allow the onboarding route itself.
  if (sync.organizationId === null) {
    const storageKey = continueWithoutOrgKey(userId)
    const continueWithoutOrg =
      window.sessionStorage.getItem(storageKey) === 'true'

    if (location.pathname !== '/onboarding') {
      if (!continueWithoutOrg) {
        return <Navigate to="/onboarding" replace />
      }

      if (!LIMITED_MODE_ALLOWED_PATHS.has(location.pathname)) {
        return <Navigate to="/" replace />
      }

      return (
        <AppProvider
          value={{
            organizationId: null,
            organization: null,
          }}
        >
          <Outlet />
        </AppProvider>
      )
    }

    return <Outlet />
  }

  // Already has an org — onboarding is no longer relevant.
  window.sessionStorage.removeItem(continueWithoutOrgKey(userId))

  if (location.pathname === '/onboarding') {
    return <Navigate to="/" replace />
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
    <div className="min-h-screen grid place-items-center text-gray-600">
      {text}
    </div>
  )
}
