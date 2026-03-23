import CollapsibleGroupCard from '@/shared/components/CollapsibleGroupCard'
import type { ProjectReportGroup } from '../api/projectTransports'

interface Props {
  group: ProjectReportGroup
  onDelete: () => void
  isDeleting: boolean
}

export default function ReportGroupCard({
  group,
  onDelete,
  isDeleting,
}: Props) {
  const totalCo2 = group.trips.reduce(
    (sum, t) => sum + (t.total_co2_kg ?? 0),
    0,
  )
  const totalKm = group.trips.reduce((sum, t) => sum + (t.distance_km ?? 0), 0)

  return (
    <CollapsibleGroupCard
      title={group.file_name ?? 'Kjørerapport'}
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
      isDeleting={isDeleting}
    >
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
          <tr>
            <th className="px-4 py-2">Sjåfør</th>
            <th className="px-4 py-2">Rute</th>
            <th className="px-4 py-2">Kjøretøy</th>
            <th className="px-4 py-2 text-right">Km</th>
            <th className="px-4 py-2 text-right">CO₂ (kg)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {group.trips.map((trip) => (
            <tr key={trip.id} className={trip.flagged ? 'bg-amber-50/50' : ''}>
              <td className="px-4 py-2 text-gray-800">
                {trip.driver_name ?? '—'}
              </td>
              <td className="px-4 py-2 text-gray-600 text-xs truncate max-w-40">
                {trip.start_address && trip.end_address
                  ? `${trip.start_address} → ${trip.end_address}`
                  : '—'}
              </td>
              <td className="px-4 py-2 text-gray-500 text-xs">
                {trip.vehicle
                  ? `${trip.vehicle.registration_number}${trip.vehicle.make ? ` (${trip.vehicle.make})` : ''}`
                  : '—'}
              </td>
              <td className="px-4 py-2 text-right text-gray-800">
                {trip.distance_km?.toLocaleString('nb-NO', {
                  maximumFractionDigits: 1,
                }) ?? '—'}
              </td>
              <td className="px-4 py-2 text-right text-gray-800">
                {trip.total_co2_kg?.toLocaleString('nb-NO', {
                  maximumFractionDigits: 2,
                }) ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CollapsibleGroupCard>
  )
}
