import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import ErrorMessage from '@/shared/components/ErrorMessage'
import InlineUndoBar from '@/shared/components/InlineUndoBar'
import FileDropZone from '@/shared/components/FileDropZone'
import SelectedFileBar from '@/shared/components/SelectedFileBar'
import { useFileSelect } from '@/shared/hooks/useFileSelect'
import { useDeferredLoading } from '@/shared/hooks/useDeferredLoading'
import { useRequireToken } from '@/shared/hooks/useRequireToken'
import { confirmTrips } from '../api/transport'
import { useTransportParse } from '../hooks/useTransportParse'
import {
  useProjectTransports,
  useDeleteTransportReport,
  useDeleteTrip,
  useUpdateTrip,
} from '../hooks/useProjectTransports'
import TransportManualInput from './TransportManualInput'
import TransportTripTable from './TransportTripTable'
import ReportGroupCard from './ReportGroupCard'

type Props = {
  projectId: number
}

export default function TransportUpload({ projectId }: Props) {
  const queryClient = useQueryClient()
  const { authReady, requireToken } = useRequireToken()
  const { parse, reset, data, setData, loading, error } = useTransportParse()
  const { selectedFile, fileError, acceptFile, clear } = useFileSelect({
    errorMessage: 'Filen må være i XML-format.',
    onClear: reset,
  })
  const { data: reportGroups, isLoading: reportsLoading } =
    useProjectTransports(projectId)
  const showReportsLoading = useDeferredLoading(reportsLoading)
  const { deleteReport, pendingReportId, undoReportDelete } =
    useDeleteTransportReport(projectId)
  const { deleteTrip, pendingTripId, pendingTripGroupId, undoTripDelete } =
    useDeleteTrip(projectId)
  const updateTripMutation = useUpdateTrip(projectId)
  const [confirming, setConfirming] = useState(false)
  const [showManual, setShowManual] = useState(false)

  const invalidateTransportData = () => {
    queryClient.invalidateQueries({ queryKey: ['co2-summary', projectId] })
    queryClient.invalidateQueries({
      queryKey: ['project-transports', projectId],
    })
  }

  const handleParse = async () => {
    if (!selectedFile || !authReady) return
    const token = await requireToken()
    await parse(selectedFile, token)
  }

  const handleRemoveTrip = (tripIndex: number) => {
    if (!data) return
    setData({
      ...data,
      trips: data.trips.filter((t) => t.trip_index !== tripIndex),
      project_transports_count: data.project_transports_count - 1,
    })
  }

  const handleConfirmTrips = async (tripIndices: number[]) => {
    if (!data) return
    setConfirming(true)
    try {
      const token = await requireToken()
      const selectedTrips = data.trips.filter((t) =>
        tripIndices.includes(t.trip_index),
      )
      await confirmTrips(projectId, selectedTrips, data.file_name, token)
      invalidateTransportData()
      clear()
      toast.success('Turer bekreftet')
    } catch {
      toast.error('Kunne ikke bekrefte turer')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Transportlogg</h3>
        <p className="mt-0.5 text-sm text-gray-500">
          Last opp en Abax Turrapport (XML) for å se kjøreturer med CO₂-utslipp,
          eller legg til turer manuelt.
        </p>
      </div>

      {!selectedFile && !data && (
        <FileDropZone
          accept=".xml"
          description="Dra og slipp Abax XML-filen her"
          onDrop={acceptFile}
        />
      )}

      {fileError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {fileError}
        </p>
      )}

      {selectedFile && !data && (
        <SelectedFileBar
          file={selectedFile}
          actionLabel="Analyser"
          loadingLabel="Analyserer…"
          isLoading={loading}
          onAction={handleParse}
          onClear={clear}
        />
      )}

      <ErrorMessage
        error={error}
        fallback="Kunne ikke analysere transportfil"
      />

      {data && (
        <>
          <TransportTripTable
            data={data}
            onRemoveTrip={handleRemoveTrip}
            onConfirmTrips={handleConfirmTrips}
            onVehicleUpdated={() => {
              void (async () => {
                if (selectedFile && authReady) {
                  const token = await requireToken()
                  parse(selectedFile, token)
                }
              })()
            }}
            confirming={confirming}
          />
          <div className="text-center">
            <button
              onClick={clear}
              className="text-sm text-gray-400 hover:text-gray-600 underline"
            >
              Last opp ny fil
            </button>
          </div>
        </>
      )}

      <div className="border-t border-gray-100 pt-4">
        <button
          onClick={() => setShowManual(!showManual)}
          className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          {showManual
            ? '↑ Skjul manuell registrering'
            : '+ Registrer tur manuelt'}
        </button>
        {showManual && (
          <TransportManualInput
            projectId={projectId}
            onTripCreated={() => {}}
          />
        )}
      </div>

      {showReportsLoading && (
        <p className="text-sm text-gray-400 text-center py-4">
          Laster transportdata…
        </p>
      )}

      {(reportGroups && reportGroups.length > 0) || pendingReportId != null ? (
        <div className="space-y-3">
          {reportGroups && reportGroups.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Opplastede kjørerapporter ({reportGroups.length})
            </p>
          )}
          {reportGroups?.map((group) => (
            <ReportGroupCard
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
          {pendingReportId != null && (
            <InlineUndoBar
              message="Kjørerapport slettet"
              onUndo={undoReportDelete}
            />
          )}
        </div>
      ) : null}
    </div>
  )
}
