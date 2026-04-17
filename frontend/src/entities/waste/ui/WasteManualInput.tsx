import { useState } from 'react'
import { useCreateManualWaste } from '../hooks/useWaste'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Props = {
  projectId: number
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
          <select
            id="wasteType"
            value={wasteType}
            onChange={(e) => setWasteType(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="metall">Metall</option>
            <option value="treverk">Treverk</option>
            <option value="betong">Betong</option>
          </select>
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
