import { useNavigate } from 'react-router-dom'
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
import FormDialog from '@/shared/components/FormDialog'
import { useCreateProject } from '../hooks/useCreateProject'

const schema = z.object({
  navn: z.string().min(1, 'Prosjektnavn er påkrevd'),
  kunde: z.string(),
  lokasjon: z.string(),
})

type FormValues = z.infer<typeof schema>

const empty: FormValues = { navn: '', kunde: '', lokasjon: '' }

const FORM_ID = 'create-project-form'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreateProjectDialog({ open, onOpenChange }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: empty,
  })
  const navigate = useNavigate()
  const { mutateAsync: create, isPending } = useCreateProject()

  async function handleValid(values: FormValues) {
    const result = await create({
      name: values.navn,
      customer_name: values.kunde || undefined,
    })
    form.reset(empty)
    onOpenChange(false)
    navigate(`/projects/${result.id}`)
  }

  const navn = form.watch('navn')

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nytt prosjekt"
      description="Fyll inn grunnleggende informasjon. Du kan legge til mer etter opprettelse."
      submitLabel="Opprett prosjekt"
      loadingLabel="Oppretter..."
      submitDisabled={!navn.trim()}
      loading={isPending}
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
            name="navn"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>Prosjektnavn *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="f.eks. Havnekvartalet Fase 2"
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
            name="kunde"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>Kunde</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Kundenavn eller organisasjon"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lokasjon"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>Lokasjon</FormLabel>
                <FormControl>
                  <Input placeholder="f.eks. Bergen, Norge" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </FormDialog>
  )
}
