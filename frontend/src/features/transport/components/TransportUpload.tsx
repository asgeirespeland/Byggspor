import { useState } from 'react'
import { useAuth } from '@clerk/react'
import { Upload, FileX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { confirmTrips, removeTrip } from '../api/transport'
import { useTransportParse } from '../hooks/useTransportParse'
import TransportManualInput from './TransportManualInput'
import TransportTripTable from './TransportTripTable'

type Props = {
  projectId: number
}

export default function TransportUpload({ projectId }: Props) {
  const { isLoaded, isSignedIn, getToken } = useAuth()
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
          <label htmlFor="transport-file-input">
            <Button size="sm" className="mt-3 cursor-pointer">
              <span>Velg fil</span>
            </Button>
          </label>
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
    </div>
  )
}
