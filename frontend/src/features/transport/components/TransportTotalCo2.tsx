import type { Trip } from '../types/transport'

export default function TransportTotalCo2({
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
    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
      CO₂: {total.toFixed(2)} kg ({count} turer)
    </span>
  )
}
