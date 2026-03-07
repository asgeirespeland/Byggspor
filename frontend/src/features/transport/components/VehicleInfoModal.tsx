import { useState } from 'react'
import { useAuth } from '@clerk/react'

import { updateVehicle } from '../api/transport'
import type { Vehicle } from '../types/transport'

interface VehicleInfoModalProps {
  vehicle: Vehicle
  onClose: () => void
  onSaved: () => void
}

const FUEL_TYPES = ['Bensin', 'Diesel', 'Elektrisk', 'Hybrid', 'Annet']

export default function VehicleInfoModal({
  vehicle,
  onClose,
  onSaved,
}: VehicleInfoModalProps) {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const [make, setMake] = useState(vehicle.make ?? '')
  const [model, setModel] = useState(vehicle.model ?? '')
  const [fuelType, setFuelType] = useState(vehicle.fuel_type ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const authReady = isLoaded && isSignedIn

  async function requireToken(): Promise<string> {
    const token = await getToken()
    if (!token) {
      throw new Error('Ikke autentisert')
    }
    return token
  }

  const handleSave = async () => {
    if (!make || !model || !fuelType) {
      setError('Alle felt må fylles ut.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const token = await requireToken()
      await updateVehicle(
        vehicle.id,
        { make, model, fuel_type: fuelType },
        token || undefined,
      )
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke lagre.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-1 text-lg font-bold text-gray-900">
          Kjøretøyinformasjon
        </h3>
        <p className="mb-4 text-sm text-gray-500">
          Reg.nr{' '}
          <span className="font-mono">{vehicle.registration_number}</span>{' '}
          mangler utslippsdata. Fyll inn informasjon manuelt.
        </p>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Merke
            </label>
            <input
              value={make}
              onChange={(e) => setMake(e.target.value)}
              placeholder="f.eks. Toyota"
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Modell
            </label>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="f.eks. Hilux"
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Drivstofftype
            </label>
            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
            >
              <option value="">Velg drivstoff</option>
              {FUEL_TYPES.map((ft) => (
                <option key={ft} value={ft}>
                  {ft}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
          >
            Avbryt
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !authReady}
            className="rounded-md bg-[#30466e] px-4 py-2 text-sm text-white transition-colors hover:bg-[#222e45] disabled:opacity-50"
          >
            {saving ? 'Lagrer...' : 'Lagre'}
          </button>
        </div>
      </div>
    </div>
  )
}
