import { useState } from 'react'
import { useCreateManualWaste } from '../hooks/useWaste'

type Props = {
  projectId: number
}

export default function WasteManualInput({ projectId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [wasteType, setWasteType] = useState('metall')
  const [quantityTons, setQuantityTons] = useState('')
  const [notes, setNotes] = useState('')

  const createWasteMutation = useCreateManualWaste(projectId)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    await createWasteMutation.mutateAsync({
      project_id: projectId,
      waste_type: wasteType,
      quantity_tons: Number(quantityTons),
      notes,
    })

    // reset
    setWasteType('metall')
    setQuantityTons('')
    setNotes('')
    setIsOpen(false)
  }

  return (
    <div className="border-t pt-6 mt-4 space-y-4">
      {/* Toggle knapp (samme plass som transport) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        {isOpen ? '↑ Skjul manuell registrering' : '+ Registrer avfall manuelt'}
      </button>

      {/* Skjema */}
      {isOpen && (
        <div className="space-y-4 rounded-2xl border p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Avfallstype
              </label>
              <select
                value={wasteType}
                onChange={(e) => setWasteType(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="metall">Metall</option>
                <option value="treverk">Treverk</option>
                <option value="betong">Betong</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Mengde (tonn)
              </label>
              <input
                type="number"
                step="0.01"
                value={quantityTons}
                onChange={(e) => setQuantityTons(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
                placeholder="f.eks. 1.5"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Notater
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
                placeholder="Valgfritt"
              />
            </div>

            <button
              type="submit"
              disabled={createWasteMutation.isPending}
              className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {createWasteMutation.isPending ? 'Lagrer...' : 'Lagre avfall'}
            </button>

            {createWasteMutation.isError && (
              <p className="text-sm text-red-600">
                Kunne ikke lagre avfallsposten.
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  )
}
