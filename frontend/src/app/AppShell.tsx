import { NavLink, Outlet } from 'react-router-dom'
import { UserButton } from '@clerk/react'

export default function AppShell() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Byggspor</h1>
          <UserButton />
          <p className="mt-2 text-gray-600">
            Construction CO2 footprint calculator
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <NavLink to="/" end className="rounded border px-3 py-2 text-sm">
            Invoice
          </NavLink>
          <NavLink to="/transport" className="rounded border px-3 py-2 text-sm">
            Transport
          </NavLink>
          <NavLink to="/profile" className="rounded border px-3 py-2 text-sm">
            User Profile
          </NavLink>
          <NavLink
            to="/organization"
            className="rounded border px-3 py-2 text-sm"
          >
            Org Settings
          </NavLink>
        </div>

        <Outlet />
      </div>
    </div>
  )
}
