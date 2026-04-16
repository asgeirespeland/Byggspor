import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import InlineUndoBar from '@/shared/components/InlineUndoBar'
import FileUploadShell from '@/shared/components/FileUploadShell'
import DataTabShell from '@/shared/components/DataTabShell'
import { confirmTrips } from '../api/transport'
import { useTransportParse } from '../hooks/useTransportParse'
import {
  useProjectTransports,
  useDeleteTransportReport,
  useDeleteTrip,
  useUpdateTrip,
} from '../hooks/useProjectTransports'
import TransportManualInput from './TransportManualInput'
import TransportPreview from './TransportPreview'
import TransportGroupCard from './TransportGroupCard'
import type { TransportParseResponse } from '../types/transport'

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
    queryClient.invalidateQueries({ queryKey: ['co2-summary', projectId] })
    queryClient.invalidateQueries({
      queryKey: ['project-transports', projectId],
    })
    queryClient.invalidateQueries({
      queryKey: ['detailed-report', projectId],
    })
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
        <TransportManualInput
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
