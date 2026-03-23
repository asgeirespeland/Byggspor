import { useState } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import CollapsibleGroupCard from '@/shared/components/CollapsibleGroupCard'
import type {
  ProjectReportGroup,
  ProjectTripItem,
  TripUpdateInput,
} from '../api/projectTransports'

interface Props {
  group: ProjectReportGroup
  onDelete: () => void
  onDeleteTrip: (tripId: number) => void
  onUpdateTrip: (tripId: number, data: TripUpdateInput) => void
  updatingTripId: number | null
}

interface TripRowProps {
  trip: ProjectTripItem
  onDelete: () => void
  onUpdate: (data: TripUpdateInput) => void
  isUpdating: boolean
}

function TripRow({ trip, onDelete, onUpdate, isUpdating }: TripRowProps) {
  const [editing, setEditing] = useState(false)
  const [editDriver, setEditDriver] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editDistance, setEditDistance] = useState('')

  const startEdit = () => {
    setEditDriver(trip.driver_name ?? '')
    setEditDate(trip.trip_date ?? '')
    setEditDistance(String(trip.distance_km ?? ''))
    setEditing(true)
  }

  const cancelEdit = () => setEditing(false)

  const saveEdit = () => {
    const distance = parseFloat(editDistance)
    if (isNaN(distance) || distance < 0) return
    onUpdate({
      driver_name: editDriver || undefined,
      trip_date: editDate || undefined,
      distance_km: distance,
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <tr className="bg-blue-50/40">
        <td className="px-4 py-1.5">
          <input
            type="text"
            value={editDriver}
            onChange={(e) => setEditDriver(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            autoFocus
          />
        </td>
        <td className="px-4 py-1.5">
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </td>
        <td className="px-4 py-1.5 text-gray-400 text-xs">
          {trip.vehicle?.registration_number ?? '—'}
        </td>
        <td className="px-4 py-1.5">
          <input
            type="number"
            min="0"
            step="any"
            value={editDistance}
            onChange={(e) => setEditDistance(e.target.value)}
            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm text-right"
          />
        </td>
        <td className="px-4 py-1.5 text-gray-400 text-xs text-right">auto</td>
        <td className="px-4 py-1.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={saveEdit}
              disabled={isUpdating}
              className="text-emerald-600 hover:text-emerald-800 disabled:opacity-40"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr
      className={
        trip.flagged ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-gray-50'
      }
    >
      <td className="px-4 py-2 text-gray-800">{trip.driver_name ?? '—'}</td>
      <td className="px-4 py-2 text-gray-500 text-xs">
        {trip.trip_date
          ? new Date(trip.trip_date + 'T00:00:00').toLocaleDateString('nb-NO')
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
      <td className="px-4 py-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={startEdit}
            className="text-gray-400 transition-colors hover:text-blue-500"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-gray-400 transition-colors hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function ReportGroupCard({
  group,
  onDelete,
  onDeleteTrip,
  onUpdateTrip,
  updatingTripId,
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
            <TripRow
              key={trip.id}
              trip={trip}
              onDelete={() => onDeleteTrip(trip.id)}
              onUpdate={(data) => onUpdateTrip(trip.id, data)}
              isUpdating={updatingTripId === trip.id}
            />
          ))}
        </tbody>
      </table>
    </CollapsibleGroupCard>
  )
}
