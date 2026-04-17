import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import InlineUndoBar from '@/features/inline-edit/InlineUndoBar'
import FileUploadShell from '@/features/file-upload/FileUploadShell'
import DataTabShell from '@/widgets/DataTabShell'
import { confirmWaste } from '../api'
import { useWasteParse } from '../hooks/useWasteParse'
import { useProjectWaste, useDeleteWasteReport } from '../hooks/useWaste'
import type { WasteParseResponse } from '../types'
import WastePreview from './WastePreview'
import WasteManualInput from './WasteManualInput'
import WasteGroupCard from './WasteGroupCard'

type Props = {
  projectId: number
}

export default function WasteUpload({ projectId }: Props) {
  const queryClient = useQueryClient()
  const { parse, reset, data, setData, loading, error } = useWasteParse()
  const wasteQuery = useProjectWaste(projectId)
  const { pendingWasteReportId, undoWasteReportDelete } =
    useDeleteWasteReport(projectId)
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
        wasteData.receiver?.name ?? null,
        token,
      )
      queryClient.invalidateQueries({
        queryKey: ['project-waste', projectId],
      })
      queryClient.invalidateQueries({
        queryKey: ['co2-summary', projectId],
      })
      queryClient.invalidateQueries({
        queryKey: ['detailed-report', projectId],
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
    <DataTabShell
      upload={
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
      }
      manualEntryForm={<WasteManualInput projectId={projectId} />}
      isLoading={wasteQuery.isLoading}
      loadingText="Laster avfallsdata…"
      sectionHeading="Registrert avfall"
      itemCount={wasteQuery.data?.length ?? 0}
      undoBar={
        pendingWasteReportId != null ? (
          <InlineUndoBar
            message="Avfallsrapport slettet"
            onUndo={undoWasteReportDelete}
          />
        ) : undefined
      }
    >
      {wasteQuery.data?.map((group) => (
        <WasteGroupCard
          key={group.source_id ?? 'manual'}
          group={group}
          projectId={projectId}
        />
      ))}
    </DataTabShell>
  )
}
