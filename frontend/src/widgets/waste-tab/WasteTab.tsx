/**
 * Waste tab: DataTabShell composition. Upload slot is features/import-waste, manual-entry
 * slot is features/log-waste. Lists WasteGroupCard backed by useProjectWaste (entity read)
 * with delete-report / delete-item / update-item via features/edit-uploaded-data hooks.
 */
import { InlineUndoBar } from '@/widgets/data-table'
import { DataTabShell } from '@/widgets/data-table'
import { useProjectWaste } from '@/entities/waste'
import { useDeleteWasteReport } from '@/features/edit-uploaded-data'
import { ImportWaste } from '@/features/import-waste'
import { WasteForm } from '@/features/log-waste'
import WasteGroupCard from './WasteGroupCard'

interface Props {
  projectId: number
}

export default function WasteTab({ projectId }: Props) {
  const wasteQuery = useProjectWaste(projectId)
  const { pendingWasteReportId, undoWasteReportDelete } =
    useDeleteWasteReport(projectId)

  return (
    <DataTabShell
      upload={<ImportWaste projectId={projectId} />}
      manualEntryForm={<WasteForm projectId={projectId} />}
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
