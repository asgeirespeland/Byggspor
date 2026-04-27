import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useRequireToken } from '@/shared/auth/useRequireToken'
import { createManualTrip } from '@/entities/transport'

interface TransportFormProps {
  projectId: number
  onTripCreated: () => void
}

const schema = z.object({
  driverName: z.string(),
  regNr: z.string().min(1, 'Reg.nr er påkrevd'),
  startAddress: z.string(),
  endAddress: z.string(),
  distanceKm: z
    .string()
    .min(1, 'Avstand er påkrevd')
    .refine(
      (v) => {
        const n = Number(v)
        return Number.isFinite(n) && n > 0
      },
      { message: 'Må være større enn 0' },
    ),
  tripDate: z.string(),
})

type FormValues = z.infer<typeof schema>

const defaults: FormValues = {
  driverName: '',
  regNr: '',
  startAddress: '',
  endAddress: '',
  distanceKm: '',
  tripDate: '',
}

export default function TransportForm({
  projectId,
  onTripCreated,
}: TransportFormProps) {
  const { authReady, requireToken } = useRequireToken()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function onSubmit(values: FormValues) {
    setError(null)
    setSuccess(false)
    setSaving(true)
    try {
      const token = await requireToken()
      await createManualTrip(
        {
          project_id: projectId,
          driver_name: values.driverName,
          registration_number: values.regNr,
          start_address: values.startAddress,
          end_address: values.endAddress,
          distance_km: Number(values.distanceKm),
          trip_date: values.tripDate,
        },
        token || undefined,
      )
      setSuccess(true)
      form.reset(defaults)
      onTripCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke opprette tur.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">
          Legg til tur manuelt
        </h4>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="driverName"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>Sjåfør</FormLabel>
                <FormControl>
                  <Input placeholder="Navn" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="regNr"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>Reg.nr *</FormLabel>
                <FormControl>
                  <Input placeholder="AB12345" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="startAddress"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>Fra</FormLabel>
                <FormControl>
                  <Input placeholder="Startadresse" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endAddress"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>Til</FormLabel>
                <FormControl>
                  <Input placeholder="Sluttadresse" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="distanceKm"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>Avstand (km) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tripDate"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>Dato</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {error && (
          <p className="rounded-md border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger-strong">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-md border border-success/20 bg-success-soft px-3 py-2 text-sm text-success-strong">
            Tur lagt til!
          </p>
        )}

        <Button type="submit" disabled={saving || !authReady}>
          {saving ? 'Lagrer…' : 'Legg til tur'}
        </Button>
      </form>
    </Form>
  )
}
