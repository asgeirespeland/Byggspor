/**
 * Waste report import flow: upload → parse → preview → confirm.
 * Wraps FileUploadShell around useWasteParse, renders WastePreview on success,
 * posts confirmWaste on user confirm and invalidates waste/report queries.
 */
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FileUploadShell } from '@/widgets/file-upload'
import { qk } from '@/shared/api/queryKeys'
import { confirmWaste } from '@/entities/waste'
import type { WasteParseResponse } from '@/entities/waste'
import { useWasteParse } from '../hooks/useWasteParse'
import WastePreview from './WastePreview'

interface Props {
  projectId: number
}

export default function ImportWaste({ projectId }: Props) {
  const queryClient = useQueryClient()
  const { parse, reset, data, setData, loading, error } = useWasteParse()
  const [confirming, setConfirming] = useState(false)

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
          onConfirm={async () => {
            setConfirming(true)
            try {
              const token = await requireToken()
              await confirmWaste(
                projectId,
                wasteData.line_items,
                wasteData.report_id,
                wasteData.receiver?.name ?? null,
                token,
              )
              queryClient.invalidateQueries({
                queryKey: qk.waste(projectId),
              })
              queryClient.invalidateQueries({
                queryKey: qk.co2Summary(projectId),
              })
              queryClient.invalidateQueries({
                queryKey: qk.detailedReport(projectId),
              })
              clear()
              toast.success('Avfallsrapport bekreftet og lagret')
            } catch {
              toast.error('Kunne ikke lagre avfallsrapporten')
            } finally {
              setConfirming(false)
            }
          }}
          confirming={confirming}
          onCancel={clear}
        />
      )}
    </FileUploadShell>
  )
}
