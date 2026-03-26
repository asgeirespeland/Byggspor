import { useState } from 'react'

import { useAppContext } from '@/shared/hooks/useAppContext'
import ItemListPanel from '@/shared/components/ItemListPanel'
import { useOrgMembers, useAddMember } from '../hooks/useOrgMembers'
import MemberCard from './MemberCard'
import AddMemberDialog from './AddMemberDialog'

export default function OrgSettings() {
  const { organizationId, organization } = useAppContext()
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: members = [], isLoading, error } = useOrgMembers(organizationId)
  const addMember = useAddMember(organizationId)

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
