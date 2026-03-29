import CollapsibleGroupCard from '@/shared/components/CollapsibleGroupCard'
import InlineUndoBar from '@/shared/components/InlineUndoBar'
import type {
  ProjectReportGroup,
  TripUpdateInput,
} from '../api/projectTransports'
import TransportTripRow from './TransportTripRow'

interface Props {
  group: ProjectReportGroup
  onDelete: () => void
  onDeleteTrip: (tripId: number) => void
  onUpdateTrip: (tripId: number, data: TripUpdateInput) => void
  updatingTripId: number | null
  pendingTripId: number | null
  onUndoTripDelete: () => void
}

export default function ReportGroupCard({
  group,
  onDelete,
  onDeleteTrip,
  onUpdateTrip,
  updatingTripId,
  pendingTripId,
  onUndoTripDelete,
}: Props) {
  const totalCo2 = group.trips.reduce(
    (sum, t) => sum + (t.total_co2_kg ?? 0),
    0,
  )
  const totalKm = group.trips.reduce((sum, t) => sum + (t.distance_km ?? 0), 0)

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
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
          <tr>
            <th className="px-4 py-2">Sjåfør</th>
            <th className="px-4 py-2">Dato</th>
            <th className="px-4 py-2">Kjøretøy</th>
            <th className="px-4 py-2 text-right">Km</th>
            <th className="px-4 py-2 text-right">CO₂ (kg)</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {group.trips.map((trip) => (
            <TransportTripRow
              key={trip.id}
              trip={trip}
              onDelete={() => onDeleteTrip(trip.id)}
              onUpdate={(data) => onUpdateTrip(trip.id, data)}
              isUpdating={updatingTripId === trip.id}
            />
          ))}
        </tbody>
      </table>
      {pendingTripId != null && (
        <InlineUndoBar message="Tur slettet" onUndo={onUndoTripDelete} />
      )}
    </CollapsibleGroupCard>
  )
}
