import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/react'

import { apiRequest } from '../../../shared/api/client'
import type { UserDto } from '../../../shared/types'

function ProfileForm({ user }: { user: UserDto }) {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone ?? '')
  const [message, setMessage] = useState('')

  const updateProfile = useMutation({
    mutationFn: async ({ name, phone }: { name: string; phone: string }) => {
      const token = await getToken()
      if (!token) throw new Error('Ikke autentisert')
      return apiRequest<UserDto>(`/users/${user.id}`, {
        method: 'PATCH',
        token,
        body: { name, phone: phone || null },
      })
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['users', 'me'], updated)
      setMessage('Profil oppdatert')
    },
  })

  async function saveProfile() {
    setMessage('')
    await updateProfile.mutateAsync({ name, phone })
  }

  return (
    <>
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
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? 'Lagrer…' : 'Lagre'}
          </button>
          <span className="self-center text-xs text-gray-500">
            Admin: {user.is_system_admin ? 'Ja' : 'Nei'}
          </span>
        </div>
      </div>

      {message && <p className="mt-3 text-sm text-green-700">{message}</p>}
      {updateProfile.error && (
        <p className="mt-3 text-sm text-red-700">
          {updateProfile.error.message}
        </p>
      )}
    </>
  )
}

export default function UserProfile() {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const authReady = isLoaded && isSignedIn

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('Ikke autentisert')
      return apiRequest<UserDto>('/users/me', { token })
    },
    enabled: authReady,
  })

  return (
    <section className="rounded bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">User Profile</h2>
      </div>

      {!authReady && (
        <p className="mb-3 rounded bg-amber-100 px-3 py-2 text-sm text-amber-900">
          Du må være logget inn for å bruke profilen
        </p>
      )}

      {isLoading && <p className="text-sm text-gray-500">Laster profil…</p>}

      {user && <ProfileForm user={user} />}

      {error && <p className="mt-3 text-sm text-red-700">{error.message}</p>}
    </section>
  )
}
