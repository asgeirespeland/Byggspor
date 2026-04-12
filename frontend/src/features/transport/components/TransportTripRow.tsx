import { Check, X } from 'lucide-react'
import RowActions from '@/shared/components/RowActions'
import { useInlineEdit } from '@/shared/hooks/useInlineEdit'
import type { ProjectTripItem, TripUpdateInput } from '../api/projectTransports'

export interface TripRowProps {
  trip: ProjectTripItem
  onDelete: () => void
  onUpdate: (data: TripUpdateInput) => void
  isUpdating: boolean
}

export default function TransportTripRow({
  trip,
  onDelete,
  onUpdate,
  isUpdating,
}: TripRowProps) {
  const { editing, value, setValue, startEdit, cancelEdit } = useInlineEdit({
    driver: '',
    date: '',
    distance: '',
  })

  const handleStartEdit = () =>
    startEdit({
      driver: trip.driver_name ?? '',
      date: trip.trip_date ?? '',
      distance: String(trip.distance_km ?? ''),
    })

  const saveEdit = () => {
    const distance = parseFloat(value.distance)
    if (isNaN(distance) || distance < 0) return
    onUpdate({
      driver_name: value.driver || undefined,
      trip_date: value.date || undefined,
      distance_km: distance,
    })
    cancelEdit()
  }

  if (editing) {
    return (
      <tr className="bg-blue-50/40">
        <td className="px-4 py-2">
          <input
            type="text"
            value={value.driver}
            onChange={(e) =>
              setValue((v) => ({ ...v, driver: e.target.value }))
            }
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            autoFocus
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="date"
            value={value.date}
            onChange={(e) => setValue((v) => ({ ...v, date: e.target.value }))}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </td>
        <td className="px-4 py-2 text-gray-400 text-xs">
          {trip.vehicle?.registration_number ?? '—'}
        </td>
        <td className="px-4 py-2">
          <input
            type="number"
            min="0"
            step="any"
            value={value.distance}
            onChange={(e) =>
              setValue((v) => ({ ...v, distance: e.target.value }))
            }
            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm text-right"
          />
        </td>
        <td className="px-4 py-2 text-gray-400 text-xs text-right">auto</td>
        <td className="px-4 py-2">
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
        <RowActions onEdit={handleStartEdit} onDelete={onDelete} />
      </td>
    </tr>
  )
}
