import { useState } from 'react'
import type { UserDto } from '@/entities/user'
import { useUpdateProfile } from '../hooks/useUpdateProfile'

export default function ProfileForm({ user }: { user: UserDto }) {
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone ?? '')
  const updateProfile = useUpdateProfile(user.id)

  async function saveProfile() {
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

      {updateProfile.error && (
        <p className="mt-3 text-sm text-danger-strong">
          {updateProfile.error.message}
        </p>
      )}
    </>
  )
}
