import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useCreateOrganization } from '@/entities/organization/hooks/useOrganization'

const schema = z.object({
  name: z.string().min(1, 'Organisasjonsnavn er påkrevd'),
  org_number: z.string(),
})

type FormValues = z.infer<typeof schema>

export default function OnboardingPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', org_number: '' },
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const createOrg = useCreateOrganization()

  async function onSubmit(values: FormValues) {
    setError('')
    try {
      await createOrg.mutateAsync({
        name: values.name.trim(),
        org_number: values.org_number.trim() || undefined,
        org_type: 'COMPANY',
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Klarte ikke opprette organisasjon',
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-600">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Opprett din organisasjon
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            F&oslash;r du kan opprette prosjekter m&aring; du registrere en
            organisasjon.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
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
                control={form.control}
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

              {error && (
                <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger-strong border border-danger/20">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={createOrg.isPending}
              >
                {createOrg.isPending ? 'Oppretter…' : 'Kom i gang'}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}
