import { Navigate, useLocation } from 'react-router-dom'
import { SignIn, SignUp, useAuth } from '@clerk/react'

export default function AuthLayout() {
  const location = useLocation()
  const isSignUp = location.pathname.startsWith('/sign-up')
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div className="min-h-screen grid place-items-center text-gray-600">
        Laster autentisering
      </div>
    )
  }

  if (isSignedIn) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Byggspor</h1>

        {isSignUp ? (
          <SignUp routing="virtual" signInUrl="/sign-in" forceRedirectUrl="/" />
        ) : (
          <SignIn routing="virtual" signUpUrl="/sign-up" forceRedirectUrl="/" />
        )}
      </div>
    </div>
  )
}
