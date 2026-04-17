import { useCurrentUser } from '@/entities/user/hooks/useCurrentUser'
import ProfileForm from './ProfileForm'

export default function UserProfile() {
  const { data: user, isLoading, error } = useCurrentUser()

  return (
    <section className="rounded bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">User Profile</h2>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Laster profil…</p>}

      {user && <ProfileForm user={user} />}

      {error && (
        <p className="mt-3 text-sm text-danger-strong">{error.message}</p>
      )}
    </section>
  )
}
