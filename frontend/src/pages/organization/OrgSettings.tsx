import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Pencil, Settings, X } from 'lucide-react'
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
import {
  useOrgMembers,
  useOrganization,
  useUpdateOrganization,
} from '@/entities/organization'
import { useCurrentUser } from '@/entities/user'
import { useAddMember, useRemoveMember } from '@/features/invite-member'
import MemberCard from './MemberCard'
import { AddMemberDialog } from '@/features/invite-member'

const createOrgSchema = z.object({
  name: z.string().min(1, 'Organisasjonsnavn er påkrevd'),
  org_number: z.string(),
})

type CreateOrgValues = z.infer<typeof createOrgSchema>

const orgInfoSchema = z.object({
  name: z.string().min(1, 'Navn er påkrevd'),
  org_number: z
    .string()
    .refine(
      (v) => !v || /^\d{9}$/.test(v.replace(/\s/g, '')),
      'Organisasjonsnummer må være 9 sifre',
    ),
  account_number: z.string(),
  address: z.string(),
  email: z.union([z.string().email('Ugyldig e-postadresse'), z.literal('')]),
  phone: z.string(),
})

type OrgInfoValues = z.infer<typeof orgInfoSchema>

export default function OrgSettings() {
  const { organizationId, organization: ctxOrg } = useAppContext()
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
  const isOwner = currentMembership?.role === 'OWNER'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">
        {ctxOrg?.name ?? ' '}
      </h1>

      <OrgInfoCard orgId={organizationId} isOwner={isOwner} />

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
            canRemove={isOwner && m.user_id !== currentUser?.id}
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

function OrgInfoCard({ orgId, isOwner }: { orgId: number; isOwner: boolean }) {
  const { data: org } = useOrganization(orgId)
  const updateOrg = useUpdateOrganization(orgId)
  const [isEditing, setIsEditing] = useState(false)

  const form = useForm<OrgInfoValues>({
    resolver: zodResolver(orgInfoSchema),
    defaultValues: {
      name: '',
      org_number: '',
      account_number: '',
      address: '',
      email: '',
      phone: '',
    },
  })

  useEffect(() => {
    if (org) {
      form.reset({
        name: org.name ?? '',
        org_number: org.org_number ?? '',
        account_number: org.account_number ?? '',
        address: org.address ?? '',
        email: org.email ?? '',
        phone: org.phone ?? '',
      })
    }
  }, [org, form])

  function handleCancel() {
    form.reset({
      name: org?.name ?? '',
      org_number: org?.org_number ?? '',
      account_number: org?.account_number ?? '',
      address: org?.address ?? '',
      email: org?.email ?? '',
      phone: org?.phone ?? '',
    })
    setIsEditing(false)
  }

  async function handleSave(values: OrgInfoValues) {
    const stripped = values.org_number.replace(/\s/g, '')
    await updateOrg.mutateAsync({
      name: values.name.trim(),
      org_number: stripped || undefined,
      account_number: values.account_number.trim() || undefined,
      address: values.address.trim() || undefined,
      email: values.email.trim() || undefined,
      phone: values.phone.trim() || undefined,
    })
    setIsEditing(false)
  }

  const fields: { label: string; key: keyof OrgInfoValues }[] = [
    { label: 'Navn', key: 'name' },
    { label: 'Organisasjonsnummer', key: 'org_number' },
    { label: 'Kontonummer', key: 'account_number' },
    { label: 'E-post', key: 'email' },
    { label: 'Telefon', key: 'phone' },
    { label: 'Adresse', key: 'address' },
  ]

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Organisasjonsinfo
          </span>
        </div>
        {isOwner && !isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Rediger
          </button>
        )}
        {isOwner && isEditing && (
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Avbryt
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {fields.map(({ label, key }) => (
            <div key={key}>
              <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
              <p className="text-sm text-foreground">
                {org?.[key] || (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSave)}
            className="p-5 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel>Navn *</FormLabel>
                    <FormControl>
                      <Input placeholder="Organisasjonsnavn" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="org_number"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel>Organisasjonsnummer</FormLabel>
                    <FormControl>
                      <Input placeholder="123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="account_number"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel>Kontonummer</FormLabel>
                    <FormControl>
                      <Input placeholder="1234.56.78901" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel>E-post</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="post@firma.no"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input placeholder="+47 000 00 000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input placeholder="Gateveien 1, 0000 Oslo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={updateOrg.isPending}>
                {updateOrg.isPending ? 'Lagrer...' : 'Lagre'}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}
