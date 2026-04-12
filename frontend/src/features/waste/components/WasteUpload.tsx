import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import FileUploadShell from '@/shared/components/FileUploadShell'
import { confirmWaste } from '../api/waste'
import { useWasteParse } from '../hooks/useWasteParse'
import type { WasteParseResponse } from '../types/waste'

type Props = {
  projectId: number
}

export default function WasteUpload({ projectId }: Props) {
  const queryClient = useQueryClient()
  const { parse, reset, data, loading, error } = useWasteParse()
  const [confirming, setConfirming] = useState(false)

  const handleConfirm = async (
    wasteData: WasteParseResponse,
    clear: () => void,
    requireToken: () => Promise<string>,
  ) => {
    setConfirming(true)
    try {
      const token = await requireToken()
      await confirmWaste(projectId, wasteData.items, wasteData.file_name, token)
      queryClient.invalidateQueries({
        queryKey: ['project-waste', projectId],
      })
      queryClient.invalidateQueries({
        queryKey: ['co2-summary', projectId],
      })
      clear()
      toast.success('Avfallsrapport bekreftet og lagret')
    } catch {
      toast.error('Kunne ikke lagre avfallsrapporten')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <FileUploadShell<WasteParseResponse>
      title="Avfallsrapport"
      description="Last opp en CSV-fil for å beregne avfall og CO₂-utslipp automatisk, eller registrer avfall manuelt."
      accept={['.csv', 'text/csv', 'text/plain', 'application/vnd.ms-excel']}
      dropDescription="Dra og slipp CSV-filen her"
      fileErrorMessage="Filen må være i CSV-format."
      analyzeLabel="Analyser"
      analyzingLabel="Analyserer…"
      parse={parse}
      reset={reset}
      data={data}
      loading={loading}
      error={error}
      errorFallback="Kunne ikke analysere avfallsrapport"
    >
      {({ data: wasteData, clear, requireToken }) => (
        <div className="space-y-4">
          <div className="rounded-xl border border-green-100 bg-green-50/60 p-4">
            <p className="text-sm font-medium text-gray-900">
              Avfallsrapport analysert
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Fant {wasteData.items_count} avfallsposter i filen{' '}
              <span className="font-medium text-gray-700">
                {wasteData.file_name}
              </span>
              .
            </p>
          </div>

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2">Type</th>
                <th className="py-2">Tonn</th>
                <th className="py-2">CO₂ (kg)</th>
              </tr>
            </thead>
            <tbody>
              {wasteData.items.map((item, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2">{item.waste_type}</td>
                  <td className="py-2">{item.quantity_tons}</td>
                  <td className="py-2">{item.total_co2_kg}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleConfirm(wasteData, clear, requireToken)}
              disabled={confirming}
              className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {confirming ? 'Lagrer…' : 'Bekreft og lagre'}
            </button>
            <button
              type="button"
              onClick={clear}
              className="rounded-md border px-4 py-2 text-gray-600 hover:bg-gray-50"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}
    </FileUploadShell>
  )
}
