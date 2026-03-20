import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@clerk/react'

import { apiRequest } from '@/shared/api/client'
import type { OrgMemberDto } from '@/shared/types'
import { useAppContext } from '@/shared/hooks/useAppContext'
import ItemListPanel from '@/shared/components/ItemListPanel'
import MemberCard from './MemberCard'
import AddMemberDialog from './AddMemberDialog'

export default function OrgSettings() {
  const { getToken } = useAuth()
  const { organizationId, organization } = useAppContext()
  const [members, setMembers] = useState<OrgMemberDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const loadMembers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const token = await getToken()
      if (!token) throw new Error('Ikke autentisert')
      const data = await apiRequest<OrgMemberDto[]>(
        `/organizations/${organizationId}/members`,
        { token },
      )
      setMembers(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Klarte ikke hente medlemmer',
      )
    } finally {
      setLoading(false)
    }
  }, [getToken, organizationId])

  useEffect(() => {
    void loadMembers()
  }, [loadMembers])

  async function handleAddMember(userId: string, role: string) {
    const token = await getToken()
    if (!token) throw new Error('Ikke autentisert')
    await apiRequest(`/organizations/${organizationId}/members`, {
      method: 'POST',
      token,
      body: { user_id: Number(userId), role },
    })
    setDialogOpen(false)
    await loadMembers()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organisasjon</h1>
        <p className="mt-1 text-sm text-gray-500">
          {organization?.name ?? '\u00A0'}
        </p>
      </div>

      <ItemListPanel
        title="Medlemmer"
        items={members}
        keyFn={(m) => m.id}
        filterFn={(m, q) =>
          m.user.name.toLowerCase().includes(q) ||
          m.user.email.toLowerCase().includes(q)
        }
        renderItem={(m) => <MemberCard member={m} />}
        searchPlaceholder="Søk medlemmer..."
        addLabel="Legg til medlem"
        emptyLabel="Ingen medlemmer enda"
        emptyHint="Medlemmer vil vises her når de er lagt til"
        onAdd={() => setDialogOpen(true)}
        loading={loading}
        error={error}
      />

      <AddMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleAddMember}
        loading={loading}
      />
    </div>
  )
}
