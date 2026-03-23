import { useState } from 'react'
import { useAuth } from '@clerk/react'
import { Upload, FileX, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { confirmTrips, removeTrip } from '../api/transport'
import { useTransportParse } from '../hooks/useTransportParse'
import {
  useProjectTransports,
  useDeleteTransportReport,
} from '../hooks/useProjectTransports'
import type { ProjectReportGroup } from '../api/projectTransports'
import TransportManualInput from './TransportManualInput'
import TransportTripTable from './TransportTripTable'

type Props = {
  projectId: number
}

export default function TransportUpload({ projectId }: Props) {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { data: reportGroups, isLoading: reportsLoading } =
    useProjectTransports(projectId)
  const deleteReportMutation = useDeleteTransportReport(projectId)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const { parse, reset, data, setData, loading, error } = useTransportParse()

  const authReady = isLoaded && isSignedIn

  async function requireToken(): Promise<string> {
    const token = await getToken()
    if (!token) throw new Error('Ikke autentisert')
    return token
  }

  const handleDragEnter = () => setIsDragging(true)
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
  }
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    acceptFile(e.dataTransfer.files)
  }
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) =>
    e.preventDefault()

  const acceptFile = (files: FileList | null) => {
    setFileError(null)
    if (!files || files.length === 0) return
    const file = files[0]
    if (file.type !== 'text/xml' && !file.name.endsWith('.xml')) {
      setFileError('Filen må være i XML-format.')
      return
    }
    setSelectedFile(file)
    reset()
  }

  const handleParse = async () => {
    if (!selectedFile || !authReady) return
    const token = await requireToken()
    await parse(selectedFile, projectId, token)
  }

  const handleClear = () => {
    setSelectedFile(null)
    setFileError(null)
    reset()
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
      handleClear()
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

      {/* Drop zone */}
      {!selectedFile && !data && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
            isDragging
              ? 'border-gray-400 bg-gray-50'
              : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
            <Upload className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-600">
            Dra og slipp Abax XML-filen her
          </p>
          <p className="mt-1 text-xs text-gray-400">— eller —</p>
          <input
            id="transport-file-input"
            type="file"
            accept=".xml"
            className="hidden"
            onChange={(e) => acceptFile(e.target.files)}
          />
          <Button
            size="sm"
            className="mt-3 cursor-pointer"
            onClick={() =>
              document.getElementById('transport-file-input')?.click()
            }
          >
            Velg fil
          </Button>
        </div>
      )}

      {/* File error */}
      {fileError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {fileError}
        </p>
      )}

      {/* Selected file */}
      {selectedFile && !data && (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200">
            <FileX className="h-4 w-4 text-gray-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-800">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-400">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleParse} disabled={loading}>
              {loading ? 'Analyserer…' : 'Analyser'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClear}
              disabled={loading}
            >
              Fjern
            </Button>
          </div>
        </div>
      )}

      {/* API error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
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
              onClick={handleClear}
              className="text-sm text-gray-400 hover:text-gray-600 underline"
            >
              Last opp ny fil
            </button>
          </div>
        </>
      )}

      {/* Manual input toggle */}
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

      {/* Existing transport reports */}
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

function ReportGroupCard({
  group,
  onDelete,
  isDeleting,
}: {
  group: ProjectReportGroup
  onDelete: () => void
  isDeleting: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  const totalCo2 = group.trips.reduce(
    (sum, t) => sum + (t.total_co2_kg ?? 0),
    0,
  )
  const totalKm = group.trips.reduce((sum, t) => sum + (t.distance_km ?? 0), 0)

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-800 truncate">
            {group.file_name ?? 'Kjørerapport'}
          </p>
          <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
            <span>{group.trips.length} turer</span>
            <span>
              {totalKm.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} km
            </span>
            {totalCo2 > 0 && (
              <span>
                {totalCo2.toLocaleString('nb-NO', { maximumFractionDigits: 1 })}{' '}
                kg CO₂
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          disabled={isDeleting}
          className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-2">Sjåfør</th>
                <th className="px-4 py-2">Rute</th>
                <th className="px-4 py-2">Kjøretøy</th>
                <th className="px-4 py-2 text-right">Km</th>
                <th className="px-4 py-2 text-right">CO₂ (kg)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {group.trips.map((trip) => (
                <tr
                  key={trip.id}
                  className={trip.flagged ? 'bg-amber-50/50' : ''}
                >
                  <td className="px-4 py-2 text-gray-800">
                    {trip.driver_name ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-gray-600 text-xs truncate max-w-40">
                    {trip.start_address && trip.end_address
                      ? `${trip.start_address} → ${trip.end_address}`
                      : '—'}
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-xs">
                    {trip.vehicle
                      ? `${trip.vehicle.registration_number}${trip.vehicle.make ? ` (${trip.vehicle.make})` : ''}`
                      : '—'}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-800">
                    {trip.distance_km?.toLocaleString('nb-NO', {
                      maximumFractionDigits: 1,
                    }) ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-800">
                    {trip.total_co2_kg?.toLocaleString('nb-NO', {
                      maximumFractionDigits: 2,
                    }) ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
