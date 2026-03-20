import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)

  const {
    data: members = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['organizations', organizationId, 'members'],
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('Ikke autentisert')
      return apiRequest<OrgMemberDto[]>(
        `/organizations/${organizationId}/members`,
        { token },
      )
    },
  })

  const addMember = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const token = await getToken()
      if (!token) throw new Error('Ikke autentisert')
      return apiRequest(`/organizations/${organizationId}/members`, {
        method: 'POST',
        token,
        body: { user_id: Number(userId), role },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['organizations', organizationId, 'members'],
      })
    },
  })

  async function handleAddMember(userId: string, role: string) {
    await addMember.mutateAsync({ userId, role })
    setDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {organization?.name ?? '\u00A0'}
      </h1>

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
        loading={isLoading}
        error={error?.message}
      />

      <AddMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleAddMember}
        loading={addMember.isPending}
      />
    </div>
  )
}
