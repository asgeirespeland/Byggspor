import { useState } from 'react'

import type { Trip, TransportParseResponse } from '../types/transport'
import VehicleInfoModal from './VehicleInfoModal'

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
    () => new Set(data.trips.map((t) => t.project_transport_id)),
  )
  const [editVehicle, setEditVehicle] = useState<Trip | null>(null)

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
      setSelected(new Set(data.trips.map((t) => t.project_transport_id)))
    }
  }

  const handleConfirm = () => {
    onConfirmTrips(Array.from(selected))
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Report metadata */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
        <span>
          <span className="font-medium text-gray-800">Turer:</span>{' '}
          {data.project_transports_count}
        </span>
        <span>
          <span className="font-medium text-gray-800">Kjøretøy:</span>{' '}
          {data.vehicles_count}
        </span>
        {data.flagged_count > 0 && (
          <span className="text-amber-700">
            <span className="font-medium">{data.flagged_count}</span> mangler
            utslippsdata
          </span>
        )}
      </div>

      {/* Trip table */}
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#30466e] text-white">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selected.size === data.trips.length}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 font-medium">Dato</th>
              <th className="px-4 py-3 font-medium">Sjåfør</th>
              <th className="px-4 py-3 font-medium">Rute</th>
              <th className="px-4 py-3 font-medium">Reg.nr</th>
              <th className="px-4 py-3 font-medium text-right">Km</th>
              <th className="px-4 py-3 font-medium text-right">CO₂ (kg)</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.trips.map((trip) => (
              <tr
                key={trip.project_transport_id}
                className={
                  trip.flagged
                    ? 'bg-amber-50'
                    : selected.has(trip.project_transport_id)
                      ? 'bg-white'
                      : 'bg-gray-50'
                }
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(trip.project_transport_id)}
                    onChange={() => toggleTrip(trip.project_transport_id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3 text-gray-600">—</td>
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
                    onClick={() => onRemoveTrip(trip.project_transport_id)}
                    className="text-xs text-red-500 hover:text-red-700"
                    title="Fjern tur"
                  >
                    Fjern
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary and confirm */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="rounded bg-gray-100 px-3 py-1 text-gray-700">
          {selected.size} av {data.trips.length} valgt
        </span>
        <TotalCo2 trips={data.trips} selected={selected} />
        <button
          onClick={handleConfirm}
          disabled={selected.size === 0 || confirming}
          className="ml-auto rounded-md bg-[#30466e] px-5 py-2 text-sm text-white transition-colors hover:bg-[#222e45] disabled:opacity-50"
        >
          {confirming ? 'Bekrefter...' : 'Bekreft valgte turer'}
        </button>
      </div>

      {/* Vehicle info modal */}
      {editVehicle && editVehicle.vehicle && (
        <VehicleInfoModal
          vehicle={editVehicle.vehicle}
          onClose={() => setEditVehicle(null)}
          onSaved={onVehicleUpdated}
        />
      )}
    </div>
  )
}

function Co2Badge({ trip, onFix }: { trip: Trip; onFix: () => void }) {
  if (!trip.flagged) {
    return (
      <span className="inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        OK
      </span>
    )
  }

  return (
    <button
      onClick={onFix}
      className="inline-block cursor-pointer rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-200"
    >
      Mangler data
    </button>
  )
}

function TotalCo2({
  trips,
  selected,
}: {
  trips: Trip[]
  selected: Set<number>
}) {
  let total = 0
  let count = 0
  for (const trip of trips) {
    if (!selected.has(trip.project_transport_id)) continue
    if (trip.total_co2_kg != null) {
      total += trip.total_co2_kg
      count++
    }
  }
  if (count === 0) return null
  return (
    <span className="rounded bg-green-100 px-3 py-1 text-green-800">
      CO₂: {total.toFixed(2)} kg ({count} turer)
    </span>
  )
}
