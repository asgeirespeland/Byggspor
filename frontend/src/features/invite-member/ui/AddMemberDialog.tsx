import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Search } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useOrgMemberCandidates } from '@/entities/organization'
import FormDialog from '@/shared/components/FormDialog'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: number
  onSubmit: (userId: string, role: string) => Promise<void>
  loading: boolean
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Eier',
  ADMIN: 'Administrator',
  MEMBER: 'Medlem',
  VIEWER: 'Leser',
}

const schema = z.object({
  userId: z.string().min(1, 'Velg en bruker'),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
})

type FormValues = z.infer<typeof schema>

const FORM_ID = 'add-member-form'

export default function AddMemberDialog({
  open,
  onOpenChange,
  organizationId,
  onSubmit,
  loading,
}: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { userId: '', role: 'MEMBER' },
  })
  const [query, setQuery] = useState('')
  const { data: candidates = [], isLoading: isSearching } =
    useOrgMemberCandidates(organizationId, query, open)

  async function handleValid(values: FormValues) {
    await onSubmit(values.userId, values.role)
    form.reset({ userId: '', role: 'MEMBER' })
    setQuery('')
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      form.reset({ userId: '', role: 'MEMBER' })
      setQuery('')
    }
    onOpenChange(nextOpen)
  }

  function handleSelectCandidate(candidateId: number) {
    form.setValue('userId', String(candidateId), { shouldValidate: true })
  }

  const userId = form.watch('userId')
  const selectedCandidate = candidates.find(
    (candidate) => String(candidate.id) === userId,
  )

  return (
    <FormDialog
      open={open}
      onOpenChange={handleClose}
      title="Legg til medlem"
      description="Søk etter en eksisterende bruker og velg en rolle for det nye medlemmet."
      submitLabel="Legg til"
      loadingLabel="Lagrer..."
      submitDisabled={!userId.trim()}
      loading={loading}
      formId={FORM_ID}
    >
      <Form {...form}>
        <form
          id={FORM_ID}
          onSubmit={form.handleSubmit(handleValid)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="userId"
            render={() => (
              <FormItem className="space-y-1.5">
                <FormLabel>Søk bruker</FormLabel>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Søk på navn eller e-post"
                    autoComplete="off"
                    data-1p-ignore
                    data-lpignore="true"
                    autoFocus
                    className="pl-9"
                  />
                </div>

                {selectedCandidate ? (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm">
                    <p className="font-medium text-gray-900">
                      {selectedCandidate.name}
                    </p>
                    <p className="text-gray-500">{selectedCandidate.email}</p>
                  </div>
                ) : query.trim() ? (
                  <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-2">
                    {isSearching ? (
                      <p className="px-2 py-1 text-sm text-gray-400">
                        Søker...
                      </p>
                    ) : candidates.length > 0 ? (
                      candidates.map((candidate) => {
                        const isSelected = userId === String(candidate.id)
                        return (
                          <button
                            key={candidate.id}
                            type="button"
                            onClick={() => handleSelectCandidate(candidate.id)}
                            className={`
                              flex w-full items-start justify-between rounded-lg px-3 py-2 text-left transition-colors
                              ${isSelected ? 'bg-violet-50 text-violet-700' : 'hover:bg-gray-50'}
                            `}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-gray-900">
                                {candidate.name}
                              </p>
                              <p className="truncate text-sm text-gray-500">
                                {candidate.email}
                              </p>
                            </div>
                            {isSelected && (
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                            )}
                          </button>
                        )
                      })
                    ) : (
                      <p className="px-2 py-1 text-sm text-gray-400">
                        Ingen brukere funnet
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">
                    Skriv inn navn eller e-post for å søke etter brukere.
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>Rolle</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) =>
                    field.onChange((value ?? 'MEMBER') as FormValues['role'])
                  }
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(value) => ROLE_LABELS[String(value)] ?? String(value)}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </FormDialog>
  )
}
