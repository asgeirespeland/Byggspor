import { useState } from 'react'
import { Settings } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAppContext } from '@/shared/hooks/useAppContext'
import ItemListPanel from '@/shared/components/ItemListPanel'
import { EditOrgSettings } from '@/features/edit-settings'
import { useOrgMembers } from '@/entities/organization'
import { useCurrentUser } from '@/entities/user'
import { useAddMember, useRemoveMember } from '@/features/invite-member'
import MemberCard from './MemberCard'
import { AddMemberDialog } from '@/features/invite-member'

export default function OrgSettings() {
  const { organizationId, organization } = useAppContext()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showCalcSettings, setShowCalcSettings] = useState(false)
  const [memberPendingRemoval, setMemberPendingRemoval] = useState<{
    userId: number
    name: string
  } | null>(null)

  const { data: members = [], isLoading, error } = useOrgMembers(organizationId)
  const { data: currentUser } = useCurrentUser()
  const addMember = useAddMember(organizationId)
  const removeMember = useRemoveMember(organizationId)

  if (organizationId == null) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Ingen organisasjon enn&#229;
        </h1>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Settings className="mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm font-medium text-gray-700">
              Organisasjonssiden er l&#229;st
            </p>
            <p className="mt-2 max-w-md text-sm text-gray-400">
              Du m&#229; bli invitert til eller opprette en organisasjon for
              &#229; se medlemmer og organisasjonsinnstillinger.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const orgId = organizationId as number

  async function handleAddMember(userId: string, role: string) {
    await addMember.mutateAsync({ userId, role })
    setDialogOpen(false)
  }

  async function handleConfirmRemoveMember() {
    if (!memberPendingRemoval) return

    await removeMember.mutateAsync({ userId: memberPendingRemoval.userId })
    setMemberPendingRemoval(null)
  }

  const currentMembership = members.find((m) => m.user_id === currentUser?.id)
  const canRemoveMembers = currentMembership?.role === 'OWNER'

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
          <EditOrgSettings orgId={orgId} />
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
        renderItem={(m) => (
          <MemberCard
            member={m}
            canRemove={canRemoveMembers && m.user_id !== currentUser?.id}
            removing={removeMember.isPending}
            onRemove={() =>
              setMemberPendingRemoval({ userId: m.user_id, name: m.user.name })
            }
          />
        )}
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
        organizationId={orgId}
        onSubmit={handleAddMember}
        loading={addMember.isPending}
      />

      <Dialog
        open={memberPendingRemoval != null}
        onOpenChange={(open) => {
          if (!open && !removeMember.isPending) setMemberPendingRemoval(null)
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Fjern medlem</DialogTitle>
            <DialogDescription>
              {memberPendingRemoval
                ? `Er du sikker på at du vil fjerne ${memberPendingRemoval.name} fra organisasjonen?`
                : 'Er du sikker på at du vil fjerne dette medlemmet fra organisasjonen?'}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              disabled={removeMember.isPending}
              onClick={() => setMemberPendingRemoval(null)}
            >
              Avbryt
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="cursor-pointer"
              disabled={removeMember.isPending}
              onClick={() => void handleConfirmRemoveMember()}
            >
              {removeMember.isPending ? 'Fjerner...' : 'Fjern medlem'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
