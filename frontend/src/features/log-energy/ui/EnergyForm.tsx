import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PriceZone } from '@/entities/energy/types'

interface EnergyFormProps {
  zones: { value: string; label: string }[] | undefined
  onSubmit: (data: {
    kwh: number
    priceZone: PriceZone | ''
    recordedDate: string
  }) => void
  isPending: boolean
  error: Error | null
}

const schema = z.object({
  kwh: z
    .string()
    .min(1, 'Påkrevd')
    .refine(
      (v) => {
        const n = Number(v)
        return Number.isFinite(n) && n >= 0
      },
      { message: 'Må være et ikke-negativt tall' },
    ),
  priceZone: z.string(),
  recordedDate: z.string(),
})

type FormValues = z.infer<typeof schema>

const shortLabel = (label: string) => label.replace(/\s*\(.*$/, '')

export default function EnergyForm({
  zones,
  onSubmit,
  isPending,
  error,
}: EnergyFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      kwh: '',
      priceZone: '',
      recordedDate: new Date().toISOString().split('T')[0],
    },
  })

  function handleValid(values: FormValues) {
    onSubmit({
      kwh: Number(values.kwh),
      priceZone: values.priceZone as PriceZone | '',
      recordedDate: values.recordedDate,
    })
    form.reset({ ...values, kwh: '' })
  }

  const kwhValue = form.watch('kwh')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleValid)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="kwh"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>Strømforbruk (kWh)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="f.eks. 15000"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priceZone"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>Prisområde (valgfritt)</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v ?? '')}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Velg prisområde…">
                        {(v) => {
                          const z = zones?.find((zone) => zone.value === v)
                          return z
                            ? `${z.value} — ${shortLabel(z.label)}`
                            : String(v ?? '')
                        }}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {zones?.map((z) => (
                      <SelectItem key={z.value} value={z.value}>
                        {z.value} — {shortLabel(z.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="recordedDate"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>Dato (valgfritt)</FormLabel>
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
            {error instanceof Error ? error.message : 'Noe gikk galt'}
          </p>
        )}

        <Button type="submit" size="sm" disabled={!kwhValue || isPending}>
          {isPending ? 'Beregner…' : 'Beregn CO₂'}
        </Button>
      </form>
    </Form>
  )
}
