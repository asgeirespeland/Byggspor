import { useState } from 'react'
import { Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { TransportParseResponse } from '../types/transport'
import VehicleInfoModal from './VehicleInfoModal'
import Co2Badge from './Co2Badge'
import TransportTotalCo2 from './TransportTotalCo2'

interface TransportTripTableProps {
  data: TransportParseResponse
  onRemoveTrip: (tripId: number) => void
  onConfirmTrips: (tripIds: number[]) => void
  onVehicleUpdated: () => void
  confirming: boolean
}

export default function TransportTripTable({
  data,
  onRemoveTrip,
  onConfirmTrips,
  onVehicleUpdated,
  confirming,
}: TransportTripTableProps) {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(data.trips.map((t) => t.trip_index)),
  )
  const [editVehicle, setEditVehicle] = useState<(typeof data.trips)[0] | null>(
    null,
  )
  const [fullscreen, setFullscreen] = useState(false)

  const toggleTrip = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === data.trips.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(data.trips.map((t) => t.trip_index)))
    }
  }

  return (
    <div className="space-y-4">
      {/* Metadata — derived from current trips so it updates on removal */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {data.trips.length} turer
        </span>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {new Set(data.trips.map((t) => t.vehicle_id).filter(Boolean)).size}{' '}
          kjøretøy
        </span>
        {data.trips.filter((t) => t.flagged).length > 0 && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            {data.trips.filter((t) => t.flagged).length} mangler utslippsdata
          </span>
        )}
        <button
          onClick={() => setFullscreen(true)}
          className="ml-auto text-gray-300 hover:text-gray-500 transition-colors"
          title="Utvid"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selected.size === data.trips.length}
                  onChange={toggleAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Dato
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Sjåfør
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Rute
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Reg.nr
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                Km
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                CO₂ (kg)
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Status
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.trips.map((trip) => (
              <tr
                key={trip.trip_index}
                className={`transition-colors ${
                  trip.flagged
                    ? 'bg-amber-50'
                    : selected.has(trip.trip_index)
                      ? 'bg-white'
                      : 'bg-gray-50'
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(trip.trip_index)}
                    onChange={() => toggleTrip(trip.trip_index)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-4 py-3 text-gray-400">—</td>
                <td className="px-4 py-3 text-gray-800">
                  {trip.driver_name ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {trip.start_address && trip.end_address
                    ? `${trip.start_address} → ${trip.end_address}`
                    : trip.start_address || trip.end_address || '—'}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">
                  {trip.registration_number}
                </td>
                <td className="px-4 py-3 text-right text-gray-800">
                  {trip.distance_km != null ? trip.distance_km.toFixed(1) : '—'}
                </td>
                <td className="px-4 py-3 text-right text-gray-800">
                  {trip.total_co2_kg != null
                    ? trip.total_co2_kg.toFixed(2)
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <Co2Badge trip={trip} onFix={() => setEditVehicle(trip)} />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onRemoveTrip(trip.trip_index)}
                    className="text-xs text-red-400 transition-colors hover:text-red-600"
                  >
                    Fjern
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary + confirm */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {selected.size} av {data.trips.length} valgt
        </span>
        <TransportTotalCo2 trips={data.trips} selected={selected} />
        <Button
          className="ml-auto"
          onClick={() => onConfirmTrips(Array.from(selected))}
          disabled={selected.size === 0 || confirming}
        >
          {confirming ? 'Bekrefter…' : 'Bekreft valgte turer'}
        </Button>
      </div>

      {editVehicle && editVehicle.vehicle && (
        <VehicleInfoModal
          vehicle={editVehicle.vehicle}
          onClose={() => setEditVehicle(null)}
          onSaved={onVehicleUpdated}
        />
      )}

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="sm:max-w-[80vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transportoversikt</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Dato
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Sjåfør
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Rute
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Reg.nr
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Km
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                    CO₂ (kg)
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.trips.map((trip) => (
                  <tr
                    key={trip.trip_index}
                    className={trip.flagged ? 'bg-amber-50' : 'bg-white'}
                  >
                    <td className="px-4 py-3 text-gray-400">—</td>
                    <td className="px-4 py-3 text-gray-800">
                      {trip.driver_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {trip.start_address && trip.end_address
                        ? `${trip.start_address} → ${trip.end_address}`
                        : trip.start_address || trip.end_address || '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {trip.registration_number}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-800">
                      {trip.distance_km != null
                        ? trip.distance_km.toFixed(1)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-800">
                      {trip.total_co2_kg != null
                        ? trip.total_co2_kg.toFixed(2)
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Co2Badge
                        trip={trip}
                        onFix={() => setEditVehicle(trip)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
