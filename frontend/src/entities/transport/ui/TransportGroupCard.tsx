import { useMemo } from 'react'
import CollapsibleGroupCard from '@/widgets/CollapsibleGroupCard'
import DataTable from '@/widgets/data-table/DataTable'
import InlineUndoBar from '@/widgets/data-table/InlineUndoBar'
import type {
  ProjectReportGroup,
  TripUpdateInput,
} from '../api/projectTransports'
import { sumBy } from '@/shared/utils/collections'
import { tripColumns, type TripRow } from '../columns'

interface Props {
  group: ProjectReportGroup
  onDelete: () => void
  onDeleteTrip: (tripId: number) => void
  onUpdateTrip: (tripId: number, data: TripUpdateInput) => void
  updatingTripId: number | null
  pendingTripId: number | null
  onUndoTripDelete: () => void
}

export default function TransportGroupCard({
  group,
  onDelete,
  onDeleteTrip,
  onUpdateTrip,
  updatingTripId,
  pendingTripId,
  onUndoTripDelete,
}: Props) {
  const rows: TripRow[] = useMemo(
    () =>
      group.trips.map((t) => ({
        driver_name: t.driver_name,
        trip_date: t.trip_date,
        start_address: t.start_address,
        end_address: t.end_address,
        registration_number: t.vehicle?.registration_number ?? null,
        vehicle_make: t.vehicle?.make ?? null,
        distance_km: t.distance_km,
        total_co2_kg: t.total_co2_kg,
        flagged: t.flagged,
      })),
    [group.trips],
  )

  const totalCo2 = sumBy(group.trips, (t) => t.total_co2_kg)
  const totalKm = sumBy(group.trips, (t) => t.distance_km)

  return (
    <CollapsibleGroupCard
      title={group.file_name ?? 'Manuelle turer'}
      summary={
        <>
          <span>{group.trips.length} turer</span>
          <span>
            {totalKm.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} km
          </span>
          {totalCo2 > 0 && (
            <span>
              {totalCo2.toLocaleString('nb-NO', { maximumFractionDigits: 1 })}{' '}
              kg CO₂
            </span>
          )}
        </>
      }
      onDelete={onDelete}
      isDeleting={false}
    >
      <DataTable
        columns={tripColumns}
        rows={rows}
        rowKey={(_, i) => group.trips[i].id}
        rowClassName={(row) =>
          row.flagged
            ? 'bg-warning-soft/50 hover:bg-warning-soft'
            : 'hover:bg-gray-50'
        }
        onSaveEdit={(_row, i, values) => {
          const trip = group.trips[i]
          const distance = parseFloat(values[4])
          if (isNaN(distance) || distance < 0) return
          onUpdateTrip(trip.id, {
            driver_name: values[0] || undefined,
            trip_date: values[1] || undefined,
            distance_km: distance,
          })
        }}
        onDeleteRow={(_row, i) => onDeleteTrip(group.trips[i].id)}
        isSaving={(_row, i) => updatingTripId === group.trips[i].id}
      />
      {pendingTripId != null && (
        <InlineUndoBar message="Tur slettet" onUndo={onUndoTripDelete} />
      )}
    </CollapsibleGroupCard>
  )
}
