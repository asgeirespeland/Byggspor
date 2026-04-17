import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import FormDialog from '@/shared/components/FormDialog'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
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
  userId: z.string().min(1, 'Bruker-ID er påkrevd'),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
})

type FormValues = z.infer<typeof schema>

const FORM_ID = 'add-member-form'

export default function AddMemberDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { userId: '', role: 'MEMBER' },
  })

  async function handleValid(values: FormValues) {
    await onSubmit(values.userId, values.role)
    form.reset({ userId: '', role: 'MEMBER' })
  }

  const userId = form.watch('userId')

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Legg til medlem"
      description="Angi bruker-ID og velg en rolle for det nye medlemmet."
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
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>Bruker-ID</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ID"
                    autoComplete="off"
                    data-1p-ignore
                    data-lpignore="true"
                    autoFocus
                    {...field}
                  />
                </FormControl>
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
                  onValueChange={(v) =>
                    field.onChange((v ?? 'MEMBER') as FormValues['role'])
                  }
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(v) => ROLE_LABELS[String(v)] ?? String(v)}
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
