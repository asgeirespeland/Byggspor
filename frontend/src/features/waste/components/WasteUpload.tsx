import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import FileUploadShell from '@/shared/components/FileUploadShell'
import { confirmWaste } from '../api/waste'
import { useWasteParse } from '../hooks/useWasteParse'
import type { WasteParseResponse } from '../types/waste'
import WastePreview from './WastePreview'

type Props = {
  projectId: number
}

export default function WasteUpload({ projectId }: Props) {
  const queryClient = useQueryClient()
  const { parse, reset, data, setData, loading, error } = useWasteParse()
  const [confirming, setConfirming] = useState(false)

  const handleConfirm = async (
    wasteData: WasteParseResponse,
    clear: () => void,
    requireToken: () => Promise<string>,
  ) => {
    setConfirming(true)
    try {
      const token = await requireToken()
      await confirmWaste(
        projectId,
        wasteData.line_items,
        wasteData.report_id,
        token,
      )
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
      description="Last opp en avfallsrapport (XML) for å beregne CO₂-utslipp fra avfall, eller registrer avfall manuelt."
      accept=".xml"
      dropDescription="Dra og slipp avfallsrapporten her"
      fileErrorMessage="Filen må være i XML-format."
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
        <WastePreview
          data={wasteData}
          setData={setData}
          onConfirm={() => handleConfirm(wasteData, clear, requireToken)}
          confirming={confirming}
          onCancel={clear}
        />
      )}
    </FileUploadShell>
  )
}
