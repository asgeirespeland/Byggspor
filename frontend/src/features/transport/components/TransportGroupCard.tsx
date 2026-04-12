import CollapsibleGroupCard from '@/shared/components/CollapsibleGroupCard'
import {
  GROUP_TH,
  GROUP_THEAD,
  GROUP_TBODY,
} from '@/shared/components/ParsePreviewShell'
import InlineUndoBar from '@/shared/components/InlineUndoBar'
import type {
  ProjectReportGroup,
  TripUpdateInput,
} from '../api/projectTransports'
import TransportRow from './TransportRow'

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
        <thead className={GROUP_THEAD}>
          <tr>
            <th className={GROUP_TH}>Sjåfør</th>
            <th className={GROUP_TH}>Dato</th>
            <th className={GROUP_TH}>Kjøretøy</th>
            <th className={`${GROUP_TH} text-right`}>Km</th>
            <th className={`${GROUP_TH} text-right`}>CO₂ (kg)</th>
            <th className={GROUP_TH} />
          </tr>
        </thead>
        <tbody className={GROUP_TBODY}>
          {group.trips.map((trip) => (
            <TransportRow
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
