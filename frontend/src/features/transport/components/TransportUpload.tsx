import { useState } from 'react'
import FileDropZone from '@/shared/components/FileDropZone'
import SelectedFileBar from '@/shared/components/SelectedFileBar'
import { useFileSelect } from '@/shared/hooks/useFileSelect'
import { useRequireToken } from '@/shared/hooks/useRequireToken'
import { confirmTrips, removeTrip } from '../api/transport'
import { useTransportParse } from '../hooks/useTransportParse'
import {
  useProjectTransports,
  useDeleteTransportReport,
} from '../hooks/useProjectTransports'
import TransportManualInput from './TransportManualInput'
import TransportTripTable from './TransportTripTable'
import ReportGroupCard from './ReportGroupCard'

type Props = {
  projectId: number
}

export default function TransportUpload({ projectId }: Props) {
  const { authReady, requireToken } = useRequireToken()
  const { parse, reset, data, setData, loading, error } = useTransportParse()
  const { selectedFile, fileError, acceptFile, clear } = useFileSelect({
    errorMessage: 'Filen må være i XML-format.',
    onClear: reset,
  })
  const { data: reportGroups, isLoading: reportsLoading } =
    useProjectTransports(projectId)
  const deleteReportMutation = useDeleteTransportReport(projectId)
  const [confirming, setConfirming] = useState(false)
  const [showManual, setShowManual] = useState(false)

  const handleParse = async () => {
    if (!selectedFile || !authReady) return
    const token = await requireToken()
    await parse(selectedFile, projectId, token)
  }

  const handleRemoveTrip = (tripId: number) => {
    if (!data) return
    setData({
      ...data,
      trips: data.trips.filter((t) => t.project_transport_id !== tripId),
      project_transports_count: data.project_transports_count - 1,
    })
    void (async () => {
      try {
        const token = await requireToken()
        await removeTrip(tripId, token)
      } catch {
        // keep optimistic UI
      }
    })()
  }

  const handleConfirmTrips = async (tripIds: number[]) => {
    setConfirming(true)
    try {
      const token = await requireToken()
      await confirmTrips(tripIds, token)
      clear()
    } catch {
      // keep data visible for retry
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

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

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
                  parse(selectedFile, projectId, token)
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

      {reportsLoading && (
        <p className="text-sm text-gray-400 text-center py-4">
          Laster transportdata…
        </p>
      )}

      {reportGroups && reportGroups.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Opplastede kjørerapporter ({reportGroups.length})
          </p>
          {reportGroups.map((group) => (
            <ReportGroupCard
              key={group.report_id}
              group={group}
              onDelete={() => {
                if (group.report_id != null)
                  deleteReportMutation.mutate(group.report_id)
              }}
              isDeleting={deleteReportMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
