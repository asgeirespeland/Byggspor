/**
 * Transport tab: DataTabShell composition. Upload slot is features/import-transport,
 * manual-entry slot is features/log-transport. Lists TransportGroupCard backed by
 * useProjectTransports with delete-report / delete-trip / update-trip via
 * features/edit-uploaded-data hooks.
 */
import { useQueryClient } from '@tanstack/react-query'
import InlineUndoBar from '@/widgets/data-table/InlineUndoBar'
import DataTabShell from '@/widgets/data-table/DataTabShell'
import { qk } from '@/shared/api/queryKeys'
import { useProjectTransports } from '@/entities/transport/hooks/useProjectTransports'
import {
  useDeleteTransportReport,
  useDeleteTrip,
  useUpdateTrip,
} from '@/features/edit-uploaded-data/hooks/useTransportMutations'
import ImportTransport from '@/features/import-transport/ui/ImportTransport'
import TransportForm from '@/features/log-transport/ui/TransportForm'
import TransportGroupCard from './TransportGroupCard'

interface Props {
  projectId: number
}

export default function TransportTab({ projectId }: Props) {
  const queryClient = useQueryClient()
  const { data: reportGroups, isLoading } = useProjectTransports(projectId)
  const { deleteReport, pendingReportId, undoReportDelete } =
    useDeleteTransportReport(projectId)
  const { deleteTrip, pendingTripId, pendingTripGroupId, undoTripDelete } =
    useDeleteTrip(projectId)
  const updateTripMutation = useUpdateTrip(projectId)

  const invalidateTransportData = () => {
    queryClient.invalidateQueries({ queryKey: qk.co2Summary(projectId) })
    queryClient.invalidateQueries({ queryKey: qk.transports(projectId) })
    queryClient.invalidateQueries({ queryKey: qk.detailedReport(projectId) })
  }

  return (
    <DataTabShell
      upload={<ImportTransport projectId={projectId} />}
      manualEntryForm={
        <TransportForm
          projectId={projectId}
          onTripCreated={invalidateTransportData}
        />
      }
      isLoading={isLoading}
      loadingText="Laster transportdata…"
      sectionHeading="Opplastede kjørerapporter"
      itemCount={reportGroups?.length ?? 0}
      undoBar={
        pendingReportId != null ? (
          <InlineUndoBar
            message="Kjørerapport slettet"
            onUndo={undoReportDelete}
          />
        ) : undefined
      }
    >
      {reportGroups?.map((group) => (
        <TransportGroupCard
          key={group.report_id ?? 'manual'}
          group={group}
          onDelete={() => {
            if (group.report_id != null) {
              void deleteReport(group.report_id)
            } else {
              group.trips.forEach((t) => void deleteTrip(t.id))
            }
          }}
          onDeleteTrip={(tripId) => void deleteTrip(tripId)}
          onUpdateTrip={(tripId, data) =>
            updateTripMutation.mutate({ tripId, data })
          }
          updatingTripId={
            updateTripMutation.isPending
              ? (updateTripMutation.variables?.tripId ?? null)
              : null
          }
          pendingTripId={
            pendingTripId != null && pendingTripGroupId === group.report_id
              ? pendingTripId
              : null
          }
          onUndoTripDelete={undoTripDelete}
        />
      ))}
    </DataTabShell>
  )
}
