/**
 * Transport tab composer: wires FileUploadShell + TransportPreview (upload flow), TransportForm
 * (manual entry), TransportGroupCard (saved reports), and InlineUndoBar. Owns confirm-trips + manual
 * invalidation of co2-summary / project-transports / detailed-report after writes.
 */
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import InlineUndoBar from '@/widgets/data-table/InlineUndoBar'
import FileUploadShell from '@/widgets/file-upload/FileUploadShell'
import DataTabShell from '@/widgets/data-table/DataTabShell'
import { qk } from '@/shared/api/queryKeys'
import { confirmTrips } from '../api/transport'
import { useTransportParse } from '../hooks/useTransportParse'
import {
  useProjectTransports,
  useDeleteTransportReport,
  useDeleteTrip,
  useUpdateTrip,
} from '../hooks/useProjectTransports'
import TransportForm from './TransportForm'
import TransportPreview from './TransportPreview'
import TransportGroupCard from './TransportGroupCard'
import type { TransportParseResponse } from '../types'

type Props = {
  projectId: number
}

export default function TransportUpload({ projectId }: Props) {
  const queryClient = useQueryClient()
  const { parse, reset, data, setData, loading, error } = useTransportParse()
  const { data: reportGroups, isLoading: reportsLoading } =
    useProjectTransports(projectId)
  const { deleteReport, pendingReportId, undoReportDelete } =
    useDeleteTransportReport(projectId)
  const { deleteTrip, pendingTripId, pendingTripGroupId, undoTripDelete } =
    useDeleteTrip(projectId)
  const updateTripMutation = useUpdateTrip(projectId)
  const [confirming, setConfirming] = useState(false)

  const invalidateTransportData = () => {
    queryClient.invalidateQueries({ queryKey: qk.co2Summary(projectId) })
    queryClient.invalidateQueries({ queryKey: qk.transports(projectId) })
    queryClient.invalidateQueries({ queryKey: qk.detailedReport(projectId) })
  }

  const handleConfirm = async (
    transportData: TransportParseResponse,
    clear: () => void,
    requireTokenFn: () => Promise<string>,
  ) => {
    setConfirming(true)
    try {
      const token = await requireTokenFn()
      await confirmTrips(
        projectId,
        transportData.trips,
        transportData.file_name,
        token,
      )
      invalidateTransportData()
      clear()
      toast.success('Transportlogg bekreftet og lagret')
    } catch {
      toast.error('Kunne ikke lagre transportloggen')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <DataTabShell
      upload={
        <FileUploadShell
          title="Transportlogg"
          description="Last opp en Abax Turrapport (XML) for å se kjøreturer med CO₂-utslipp, eller legg til turer manuelt."
          accept=".xml"
          dropDescription="Dra og slipp Abax XML-filen her"
          fileErrorMessage="Filen må være i XML-format."
          parse={parse}
          reset={reset}
          data={data}
          loading={loading}
          error={error}
          errorFallback="Kunne ikke analysere transportfil"
        >
          {({ data: transportData, clear, requireToken: requireTokenFn }) => (
            <TransportPreview
              data={transportData}
              setData={setData}
              onConfirm={() =>
                handleConfirm(transportData, clear, requireTokenFn)
              }
              confirming={confirming}
              onCancel={clear}
            />
          )}
        </FileUploadShell>
      }
      manualEntryForm={
        <TransportForm
          projectId={projectId}
          onTripCreated={invalidateTransportData}
        />
      }
      isLoading={reportsLoading}
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
