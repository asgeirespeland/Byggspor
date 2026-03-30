import Co2TotalBadge from '@/shared/components/Co2TotalBadge'
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
    if (!selected.has(trip.trip_index)) continue
    if (trip.total_co2_kg != null) {
      total += trip.total_co2_kg
      count++
    }
  }
  return <Co2TotalBadge total={total} count={count} label="turer" />
}
