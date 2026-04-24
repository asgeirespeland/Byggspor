import { useState } from 'react'
import { Settings } from 'lucide-react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useAppContext } from '@/shared/hooks/useAppContext'
import ItemListPanel from '@/shared/components/ItemListPanel'
import { EditOrgSettings } from '@/features/edit-settings'
import { useOrgMembers } from '@/entities/organization'
import { useAddMember } from '@/features/invite-member'
import MemberCard from './MemberCard'
import { AddMemberDialog } from '@/features/invite-member'

export default function OrgSettings() {
  const { organizationId, organization } = useAppContext()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showCalcSettings, setShowCalcSettings] = useState(false)

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

      <Collapsible
        open={showCalcSettings}
        onOpenChange={setShowCalcSettings}
        className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <Settings className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              Beregningsinnstillinger
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {showCalcSettings ? 'Skjul' : 'Vis'}
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-gray-100 p-5">
          <EditOrgSettings orgId={organizationId} />
        </CollapsibleContent>
      </Collapsible>

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
