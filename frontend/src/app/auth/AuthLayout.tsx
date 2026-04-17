import { Navigate, useLocation } from 'react-router-dom'
import { SignIn, SignUp, useAuth } from '@clerk/react'

export default function AuthLayout() {
  const location = useLocation()
  const isSignUp = location.pathname.startsWith('/sign-up')
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div className="min-h-screen grid place-items-center text-gray-500 text-sm">
        Laster autentisering…
      </div>
    )
  }

  if (isSignedIn) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gray-900 p-12 text-white">
        <div>
          <span className="text-lg font-semibold tracking-tight">Byggspor</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            Spor klimaavtrykket til dine byggeprosjekter.
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Beregn CO₂-utslipp fra materialer, transport, avfall og energi — og
            gjør klimaansvaret synlig i hele verdikjeden.
          </p>
        </div>

        <p className="text-gray-600 text-sm">
          © {new Date().getFullYear()} Byggspor
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden text-center">
          <span className="text-2xl font-bold text-gray-900">Byggspor</span>
          <p className="mt-1 text-sm text-gray-500">
            Klimasporing for byggebransjen
          </p>
        </div>

        {isSignUp ? (
          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/sign-in"
            forceRedirectUrl="/"
          />
        ) : (
          <SignIn
            path="/sign-in"
            routing="path"
            signUpUrl="/sign-up"
            forceRedirectUrl="/"
          />
        )}
      </div>
    </div>
  )
}
