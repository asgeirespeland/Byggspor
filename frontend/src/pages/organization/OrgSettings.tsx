import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Settings } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAppContext } from '@/shared/hooks/useAppContext'
import ItemListPanel from '@/shared/components/ItemListPanel'
import { EditOrgSettings } from '@/features/edit-settings'
import { useCreateOrganization } from '@/features/create-organization'
import { useOrgMembers } from '@/entities/organization'
import { useCurrentUser } from '@/entities/user'
import { useAddMember, useRemoveMember } from '@/features/invite-member'
import MemberCard from './MemberCard'
import { AddMemberDialog } from '@/features/invite-member'

const createOrgSchema = z.object({
  name: z.string().min(1, 'Organisasjonsnavn er påkrevd'),
  org_number: z.string(),
})

type CreateOrgValues = z.infer<typeof createOrgSchema>

export default function OrgSettings() {
  const { organizationId, organization } = useAppContext()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showCalcSettings, setShowCalcSettings] = useState(false)
  const [memberPendingRemoval, setMemberPendingRemoval] = useState<{
    userId: number
    name: string
  } | null>(null)
  const [createOrgError, setCreateOrgError] = useState('')

  const createOrgForm = useForm<CreateOrgValues>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { name: '', org_number: '' },
  })

  const createOrg = useCreateOrganization()
  const { data: members = [], isLoading, error } = useOrgMembers(organizationId)
  const { data: currentUser } = useCurrentUser()
  const addMember = useAddMember(organizationId)
  const removeMember = useRemoveMember(organizationId)

  async function handleCreateOrganization(values: CreateOrgValues) {
    setCreateOrgError('')
    try {
      await createOrg.mutateAsync({
        name: values.name.trim(),
        org_number: values.org_number.trim() || undefined,
        org_type: 'COMPANY',
      })
    } catch (err) {
      setCreateOrgError(
        err instanceof Error
          ? err.message
          : 'Klarte ikke opprette organisasjon',
      )
    }
  }

  if (organizationId == null) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">
          Opprett organisasjon
        </h1>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-600">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm text-muted-foreground">
              Opprett en organisasjon når du er klar til å samarbeide med andre.
            </p>
          </div>

          <Form {...createOrgForm}>
            <form
              onSubmit={createOrgForm.handleSubmit(handleCreateOrganization)}
              className="space-y-4"
            >
              <FormField
                control={createOrgForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel>Organisasjonsnavn *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="f.eks. Byggfirma AS"
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createOrgForm.control}
                name="org_number"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel>Organisasjonsnummer</FormLabel>
                    <FormControl>
                      <Input placeholder="f.eks. 123 456 789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {createOrgError && (
                <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger-strong border border-danger/20">
                  {createOrgError}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={createOrg.isPending}
              >
                {createOrg.isPending ? 'Oppretter...' : 'Opprett organisasjon'}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    )
  }

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
      <h1 className="text-2xl font-bold text-foreground">
        {organization?.name ?? '\u00A0'}
      </h1>

      <Collapsible
        open={showCalcSettings}
        onOpenChange={setShowCalcSettings}
        className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Beregningsinnstillinger
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {showCalcSettings ? 'Skjul' : 'Vis'}
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-border p-5">
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
        organizationId={organizationId}
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
