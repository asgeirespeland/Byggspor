import { useMemo, useState } from 'react'
import { Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import FullscreenDialog from '@/shared/components/FullscreenDialog'
import { useSelection } from '@/shared/hooks/useSelection'
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

const THEAD_CLASSES =
  'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400'

export default function TransportTripTable({
  data,
  onRemoveTrip,
  onConfirmTrips,
  onVehicleUpdated,
  confirming,
}: TransportTripTableProps) {
  const allIds = useMemo(
    () => data.trips.map((t) => t.trip_index),
    [data.trips],
  )
  const { selected, toggle, toggleAll } = useSelection(allIds)
  const [editVehicle, setEditVehicle] = useState<(typeof data.trips)[0] | null>(
    null,
  )
  const [fullscreen, setFullscreen] = useState(false)

  const flaggedCount = data.trips.filter((t) => t.flagged).length
  const vehicleCount = new Set(
    data.trips.map((t) => t.vehicle_id).filter(Boolean),
  ).size

  const renderRow = (
    trip: (typeof data.trips)[0],
    opts?: { interactive?: boolean },
  ) => {
    const interactive = opts?.interactive ?? false
    return (
      <tr
        key={trip.trip_index}
        className={`transition-colors ${
          trip.flagged
            ? 'bg-amber-50'
            : interactive && !selected.has(trip.trip_index)
              ? 'bg-gray-50'
              : 'bg-white'
        }`}
      >
        {interactive && (
          <td className="px-4 py-3">
            <input
              type="checkbox"
              checked={selected.has(trip.trip_index)}
              onChange={() => toggle(trip.trip_index)}
              className="rounded border-gray-300"
            />
          </td>
        )}
        <td className="px-4 py-3 text-gray-400">—</td>
        <td className="px-4 py-3 text-gray-800">{trip.driver_name ?? '—'}</td>
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
          {trip.total_co2_kg != null ? trip.total_co2_kg.toFixed(2) : '—'}
        </td>
        <td className="px-4 py-3">
          <Co2Badge trip={trip} onFix={() => setEditVehicle(trip)} />
        </td>
        {interactive && (
          <td className="px-4 py-3">
            <button
              onClick={() => onRemoveTrip(trip.trip_index)}
              className="text-xs text-red-400 transition-colors hover:text-red-600"
            >
              Fjern
            </button>
          </td>
        )}
      </tr>
    )
  }

  return (
    <div className="space-y-4">
      {/* Metadata badges */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {data.trips.length} turer
        </span>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {vehicleCount} kjøretøy
        </span>
        {flaggedCount > 0 && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            {flaggedCount} mangler utslippsdata
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
              <th className={THEAD_CLASSES}>Dato</th>
              <th className={THEAD_CLASSES}>Sjåfør</th>
              <th className={THEAD_CLASSES}>Rute</th>
              <th className={THEAD_CLASSES}>Reg.nr</th>
              <th className={`${THEAD_CLASSES} text-right`}>Km</th>
              <th className={`${THEAD_CLASSES} text-right`}>CO₂ (kg)</th>
              <th className={THEAD_CLASSES}>Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.trips.map((trip) => renderRow(trip, { interactive: true }))}
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

      <FullscreenDialog
        open={fullscreen}
        onOpenChange={setFullscreen}
        title="Transportoversikt"
      >
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className={THEAD_CLASSES}>Dato</th>
              <th className={THEAD_CLASSES}>Sjåfør</th>
              <th className={THEAD_CLASSES}>Rute</th>
              <th className={THEAD_CLASSES}>Reg.nr</th>
              <th className={`${THEAD_CLASSES} text-right`}>Km</th>
              <th className={`${THEAD_CLASSES} text-right`}>CO₂ (kg)</th>
              <th className={THEAD_CLASSES}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.trips.map((trip) => renderRow(trip))}
          </tbody>
        </table>
      </FullscreenDialog>
    </div>
  )
}
