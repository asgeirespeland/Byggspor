import { useState } from 'react'
import { useAuth } from '@clerk/react'

import { createManualTrip } from '../api/transport'

interface TransportManualInputProps {
  projectId: number
  onTripCreated: () => void
}

export default function TransportManualInput({
  projectId,
  onTripCreated,
}: TransportManualInputProps) {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const [driverName, setDriverName] = useState('')
  const [regNr, setRegNr] = useState('')
  const [startAddress, setStartAddress] = useState('')
  const [endAddress, setEndAddress] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [tripDate, setTripDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const authReady = isLoaded && isSignedIn

  async function requireToken(): Promise<string> {
    const token = await getToken()
    if (!token) {
      throw new Error('Ikke autentisert')
    }
    return token
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const km = parseFloat(distanceKm)
    if (!regNr || !distanceKm || isNaN(km) || km <= 0) {
      setError('Reg.nr og avstand er påkrevd.')
      return
    }

    setSaving(true)
    try {
      const token = await requireToken()
      await createManualTrip(
        {
          project_id: projectId,
          driver_name: driverName,
          registration_number: regNr,
          start_address: startAddress,
          end_address: endAddress,
          distance_km: km,
          trip_date: tripDate,
        },
        token || undefined,
      )
      setSuccess(true)
      setDriverName('')
      setRegNr('')
      setStartAddress('')
      setEndAddress('')
      setDistanceKm('')
      setTripDate('')
      onTripCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke opprette tur.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <h4 className="text-lg font-semibold text-gray-800">
        Legg til tur manuelt
      </h4>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Sjåfør
          </label>
          <input
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            placeholder="Navn"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Reg.nr *
          </label>
          <input
            value={regNr}
            onChange={(e) => setRegNr(e.target.value)}
            placeholder="AB12345"
            className="w-full rounded border px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Fra
          </label>
          <input
            value={startAddress}
            onChange={(e) => setStartAddress(e.target.value)}
            placeholder="Startadresse"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Til
          </label>
          <input
            value={endAddress}
            onChange={(e) => setEndAddress(e.target.value)}
            placeholder="Sluttadresse"
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Avstand (km) *
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={distanceKm}
            onChange={(e) => setDistanceKm(e.target.value)}
            placeholder="0.0"
            className="w-full rounded border px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Dato
          </label>
          <input
            type="date"
            value={tripDate}
            onChange={(e) => setTripDate(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Tur lagt til!</p>}

      <button
        type="submit"
        disabled={saving || !authReady}
        className="rounded-md bg-[#30466e] px-5 py-2 text-sm text-white transition-colors hover:bg-[#222e45] disabled:opacity-50"
      >
        {saving ? 'Lagrer...' : 'Legg til tur'}
      </button>
    </form>
  )
}
