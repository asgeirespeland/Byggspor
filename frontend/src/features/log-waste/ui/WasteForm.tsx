import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateManualWaste } from '../hooks/useCreateManualWaste'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Props = {
  projectId: number
}

const WASTE_TYPE_LABELS: Record<string, string> = {
  metall: 'Metall',
  treverk: 'Treverk',
  betong: 'Betong',
}

const schema = z.object({
  wasteType: z.enum(['metall', 'treverk', 'betong']),
  quantityTons: z
    .string()
    .min(1, 'Påkrevd')
    .refine(
      (v) => {
        const n = Number(v)
        return Number.isFinite(n) && n > 0
      },
      { message: 'Må være større enn 0' },
    ),
  notes: z.string(),
})

type FormValues = z.infer<typeof schema>

const defaults: FormValues = {
  wasteType: 'metall',
  quantityTons: '',
  notes: '',
}

export default function WasteForm({ projectId }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  })
  const createWasteMutation = useCreateManualWaste(projectId)

  function onSubmit(values: FormValues) {
    createWasteMutation.mutate(
      {
        project_id: projectId,
        waste_type: values.wasteType,
        quantity: Number(values.quantityTons),
        notes: values.notes,
      },
      { onSuccess: () => form.reset(defaults) },
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground">
          Registrer avfall manuelt
        </h4>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="wasteType"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>Avfallstype</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v ?? 'metall')}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(v) => WASTE_TYPE_LABELS[String(v)] ?? String(v)}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(WASTE_TYPE_LABELS).map(([value, label]) => (
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
          <FormField
            control={form.control}
            name="quantityTons"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>Mengde (tonn) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="f.eks. 1.5"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel>Notater</FormLabel>
              <FormControl>
                <Input placeholder="Valgfritt" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {createWasteMutation.isError && (
          <p className="rounded-md border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger-strong">
            Kunne ikke lagre avfallsposten.
          </p>
        )}

        <Button type="submit" disabled={createWasteMutation.isPending}>
          {createWasteMutation.isPending ? 'Lagrer…' : 'Lagre avfall'}
        </Button>
      </form>
    </Form>
  )
}
