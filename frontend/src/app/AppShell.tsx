import { useState } from 'react'

import { InvoiceUpload } from '../features/invoice'
import { OrgSettings } from '../features/organization'
import { UserProfile } from '../features/user'
import { useAuth } from '../shared/auth/useAuth'

/**
 * Temporary app shell with a lightweight view switcher.
 * Will be replaced by a proper router in a future issue.
 */
type View = 'invoice' | 'profile' | 'org'

export default function AppShell() {
  const [view, setView] = useState<View>('invoice')
  const { token, setToken } = useAuth()

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Byggspor</h1>
          <p className="mt-2 text-gray-600">
            Construction CO₂ footprint calculator
          </p>
        </div>

        <div className="mb-6 rounded bg-white p-4">
          {/* Temporary token input — remove once Clerk auth is integrated. */}
          <label className="mb-2 block text-sm text-gray-700">
            Bearer token (for beskyttede endepunkter)
          </label>
          <input
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Paste Clerk JWT"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setView('invoice')}
            className="rounded border px-3 py-2 text-sm"
          >
            Invoice
          </button>
          <button
            onClick={() => setView('profile')}
            className="rounded border px-3 py-2 text-sm"
          >
            User Profile
          </button>
          <button
            onClick={() => setView('org')}
            className="rounded border px-3 py-2 text-sm"
          >
            Org Settings
          </button>
        </div>

        {view === 'invoice' && <InvoiceUpload />}
        {view === 'profile' && <UserProfile />}
        {view === 'org' && <OrgSettings />}
      </div>
    </div>
  )
}
