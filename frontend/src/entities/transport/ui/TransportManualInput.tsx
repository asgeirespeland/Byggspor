import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRequireToken } from '@/shared/hooks/useRequireToken'
import { createManualTrip } from '../api/transport'

interface TransportManualInputProps {
  projectId: number
  onTripCreated: () => void
}

export default function TransportManualInput({
  projectId,
  onTripCreated,
}: TransportManualInputProps) {
  const { authReady, requireToken } = useRequireToken()
  const [driverName, setDriverName] = useState('')
  const [regNr, setRegNr] = useState('')
  const [startAddress, setStartAddress] = useState('')
  const [endAddress, setEndAddress] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [tripDate, setTripDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <h4 className="text-sm font-semibold text-gray-700">
        Legg til tur manuelt
      </h4>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="driverName">Sjåfør</Label>
          <Input
            id="driverName"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            placeholder="Navn"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="regNr">Reg.nr *</Label>
          <Input
            id="regNr"
            value={regNr}
            onChange={(e) => setRegNr(e.target.value)}
            placeholder="AB12345"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="startAddress">Fra</Label>
          <Input
            id="startAddress"
            value={startAddress}
            onChange={(e) => setStartAddress(e.target.value)}
            placeholder="Startadresse"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endAddress">Til</Label>
          <Input
            id="endAddress"
            value={endAddress}
            onChange={(e) => setEndAddress(e.target.value)}
            placeholder="Sluttadresse"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="distanceKm">Avstand (km) *</Label>
          <Input
            id="distanceKm"
            type="number"
            step="0.1"
            min="0"
            value={distanceKm}
            onChange={(e) => setDistanceKm(e.target.value)}
            placeholder="0.0"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tripDate">Dato</Label>
          <Input
            id="tripDate"
            type="date"
            value={tripDate}
            onChange={(e) => setTripDate(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger-strong">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-md border border-success/20 bg-success-soft px-3 py-2 text-sm text-success-strong">
          Tur lagt til!
        </p>
      )}

      <Button type="submit" disabled={saving || !authReady}>
        {saving ? 'Lagrer…' : 'Legg til tur'}
      </Button>
    </form>
  )
}
