import { useState } from 'react'

import { apiRequest } from '../shared/api/client'
import type { UserDto } from '../shared/types'

type UserProfileProps = {
  token: string
}

/**
 * Profile view for loading and updating the currently authenticated user.
 */
export default function UserProfile({ token }: UserProfileProps) {
  const [user, setUser] = useState<UserDto | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  /** Fetches /users/me and hydrates editable form state. */
  async function loadProfile() {
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const data = await apiRequest<UserDto>('/users/me', {
        token,
      })
      setUser(data)
      setName(data.name)
      setPhone(data.phone ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Klarte ikke hente profil')
    } finally {
      setLoading(false)
    }
  }

  /** Persists editable profile fields for the current user. */
  async function saveProfile() {
    if (!user) {
      setError('Last inn profil først')
      return
    }

    setLoading(true)
    setMessage('')
    setError('')

    try {
      const updated = await apiRequest<UserDto>(`/users/${user.id}`, {
        method: 'PATCH',
        token,
        body: {
          name,
          phone: phone || null,
        },
      })
      setUser(updated)
      setMessage('Profil oppdatert')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Klarte ikke oppdatere profil',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">User Profile</h2>
        <button
          onClick={loadProfile}
          className="rounded border px-3 py-2 text-sm"
          disabled={loading || !token}
        >
          {loading ? 'Laster…' : 'Hent profil'}
        </button>
      </div>

      {!token && (
        <p className="mb-3 rounded bg-amber-100 px-3 py-2 text-sm text-amber-900">
          Legg inn Bearer-token øverst for å bruke profilen.
        </p>
      )}

      {user && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-gray-700">E-post</label>
            <input
              value={user.email}
              readOnly
              className="w-full rounded border bg-gray-100 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Navn</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Telefon</label>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={saveProfile}
              className="rounded bg-black px-4 py-2 text-sm text-white"
              disabled={loading}
            >
              Lagre
            </button>
            <span className="self-center text-xs text-gray-500">
              Admin: {user.is_system_admin ? 'Ja' : 'Nei'}
            </span>
          </div>
        </div>
      )}

      {message && <p className="mt-3 text-sm text-green-700">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </section>
  )
}
