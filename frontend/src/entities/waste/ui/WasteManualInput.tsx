import { useState } from 'react'
import { useCreateManualWaste } from '../hooks/useWaste'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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

export default function WasteManualInput({ projectId }: Props) {
  const [wasteType, setWasteType] = useState('metall')
  const [quantityTons, setQuantityTons] = useState('')
  const [notes, setNotes] = useState('')

  const createWasteMutation = useCreateManualWaste(projectId)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    createWasteMutation.mutate(
      {
        project_id: projectId,
        waste_type: wasteType,
        quantity: Number(quantityTons),
        notes,
      },
      {
        onSuccess: () => {
          setWasteType('metall')
          setQuantityTons('')
          setNotes('')
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700">
        Registrer avfall manuelt
      </h4>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="wasteType">Avfallstype</Label>
          <Select
            value={wasteType}
            onValueChange={(v) => setWasteType(v ?? '')}
          >
            <SelectTrigger id="wasteType" className="w-full">
              <SelectValue>
                {(v) => WASTE_TYPE_LABELS[String(v)] ?? String(v)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(WASTE_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="quantityTons">Mengde (tonn) *</Label>
          <Input
            id="quantityTons"
            type="number"
            step="0.01"
            required
            value={quantityTons}
            onChange={(e) => setQuantityTons(e.target.value)}
            placeholder="f.eks. 1.5"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notater</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Valgfritt"
        />
      </div>

      {createWasteMutation.isError && (
        <p className="rounded-md border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger-strong">
          Kunne ikke lagre avfallsposten.
        </p>
      )}

      <Button type="submit" disabled={createWasteMutation.isPending}>
        {createWasteMutation.isPending ? 'Lagrer…' : 'Lagre avfall'}
      </Button>
    </form>
  )
}
