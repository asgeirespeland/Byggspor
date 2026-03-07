import { useState } from 'react'

import { useAuth } from '../../../shared/auth/useAuth'
import { confirmTrips, removeTrip } from '../api/transport'
import { useTransportParse } from '../hooks/useTransportParse'
import TransportManualInput from './TransportManualInput'
import TransportTripTable from './TransportTripTable'

const DEFAULT_PROJECT_ID = 1

export default function TransportUpload() {
  const { token } = useAuth()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const { parse, reset, data, setData, loading, error } = useTransportParse()

  const handleDragEnter = () => setIsDragging(true)

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    acceptFile(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

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
    if (!selectedFile) return
    await parse(selectedFile, DEFAULT_PROJECT_ID, token || undefined)
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
    removeTrip(tripId, token || undefined).catch(() => {})
  }

  const handleConfirmTrips = async (tripIds: number[]) => {
    setConfirming(true)
    try {
      await confirmTrips(tripIds, token || undefined)
      handleClear()
    } catch {
      // keep data visible so user can retry
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div>
      <h3 className="pb-2 text-2xl font-bold text-gray-900">Transportlogg</h3>
      <p className="pb-2 text-gray-600">
        Last opp en Abax Turrapport (XML) for å se kjøreturer med CO₂-utslipp,
        eller legg til turer manuelt.
      </p>

      <div className="rounded-md bg-white p-7">
        {/* Drop zone */}
        {!selectedFile && !data && (
          <div
            className={`rounded-md border-2 border-dashed p-10 text-center transition-colors ${
              isDragging
                ? 'border-[#30466e] bg-indigo-200'
                : 'border-gray-400 bg-indigo-100'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          >
            <p className="text-gray-700">Dra og slipp Abax XML-filen her</p>
            <p className="mb-5 mt-5 text-gray-400">— eller —</p>
            <input
              id="transport-file-input"
              type="file"
              accept=".xml"
              className="hidden"
              onChange={(e) => acceptFile(e.target.files)}
            />
            <label
              htmlFor="transport-file-input"
              className="inline-block cursor-pointer rounded-md bg-[#30466e] px-6 py-4 text-amber-50 transition-colors hover:bg-[#222e45]"
            >
              Velg fil
            </label>
          </div>
        )}

        {/* File error */}
        {fileError && <p className="mt-3 text-sm text-red-600">{fileError}</p>}

        {/* Selected file (before parsing) */}
        {selectedFile && !data && (
          <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="text-[#30466e]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
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
              <button
                onClick={handleParse}
                disabled={loading}
                className="rounded-md bg-[#30466e] px-4 py-2 text-sm text-white transition-colors hover:bg-[#222e45] disabled:opacity-50"
              >
                {loading ? 'Analyserer...' : 'Analyser'}
              </button>
              <button
                onClick={handleClear}
                disabled={loading}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
              >
                Fjern
              </button>
            </div>
          </div>
        )}

        {/* API error */}
        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Parsed trip results */}
        {data && (
          <>
            <TransportTripTable
              data={data}
              onRemoveTrip={handleRemoveTrip}
              onConfirmTrips={handleConfirmTrips}
              onVehicleUpdated={() => {
                // Re-parse to get updated CO2 values
                if (selectedFile) {
                  parse(selectedFile, DEFAULT_PROJECT_ID, token || undefined)
                }
              }}
              confirming={confirming}
            />
            <div className="mt-4 text-center">
              <button
                onClick={handleClear}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Last opp ny fil
              </button>
            </div>
          </>
        )}

        {/* Manual input toggle */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <button
            onClick={() => setShowManual(!showManual)}
            className="text-sm text-[#30466e] hover:underline"
          >
            {showManual
              ? 'Skjul manuell registrering'
              : 'Registrer tur manuelt'}
          </button>
          {showManual && (
            <TransportManualInput
              projectId={DEFAULT_PROJECT_ID}
              onTripCreated={() => {}}
            />
          )}
        </div>
      </div>
    </div>
  )
}
