import { useAuth } from '@clerk/react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

export default function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth()
  const location = useLocation()

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

  return <Outlet />
}
