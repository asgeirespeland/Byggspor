import EditableRow, { type GroupColumn } from '@/shared/components/EditableRow'
import type { ProjectTripItem, TripUpdateInput } from '../api/projectTransports'

export interface TripRowProps {
  trip: ProjectTripItem
  onDelete: () => void
  onUpdate: (data: TripUpdateInput) => void
  isUpdating: boolean
}

const INPUT = 'w-full rounded border border-gray-300 px-2 py-1 text-sm'

const columns: GroupColumn<ProjectTripItem>[] = [
  {
    header: 'Sjåfør',
    render: (t) => (
      <span className="text-gray-800">{t.driver_name ?? '—'}</span>
    ),
    editRender: (value, onChange) => (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT}
        autoFocus
      />
    ),
  },
  {
    header: 'Dato',
    render: (t) => (
      <span className="text-gray-500 text-xs">
        {t.trip_date
          ? new Date(t.trip_date + 'T00:00:00').toLocaleDateString('nb-NO')
          : '—'}
      </span>
    ),
    editRender: (value, onChange) => (
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT} w-36`}
      />
    ),
  },
  {
    header: 'Kjøretøy',
    render: (t) => (
      <span className="text-gray-500 text-xs">
        {t.vehicle
          ? `${t.vehicle.registration_number}${t.vehicle.make ? ` (${t.vehicle.make})` : ''}`
          : '—'}
      </span>
    ),
  },
  {
    header: 'Km',
    align: 'right',
    render: (t) => (
      <span className="text-gray-800">
        {t.distance_km?.toLocaleString('nb-NO', {
          maximumFractionDigits: 1,
        }) ?? '—'}
      </span>
    ),
    editRender: (value, onChange) => (
      <input
        type="number"
        min="0"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT} w-20 text-right`}
      />
    ),
  },
  {
    header: 'CO₂ (kg)',
    align: 'right',
    render: (t) => (
      <span className="text-gray-800">
        {t.total_co2_kg?.toLocaleString('nb-NO', {
          maximumFractionDigits: 2,
        }) ?? '—'}
      </span>
    ),
  },
]

export default function TransportRow({
  trip,
  onDelete,
  onUpdate,
  isUpdating,
}: TripRowProps) {
  return (
    <EditableRow
      row={trip}
      columns={columns}
      rowClassName={
        trip.flagged ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-gray-50'
      }
      getEditValues={(t) => ({
        0: t.driver_name ?? '',
        1: t.trip_date ?? '',
        3: String(t.distance_km ?? ''),
      })}
      onSave={(values) => {
        const distance = parseFloat(values[3])
        if (isNaN(distance) || distance < 0) return
        onUpdate({
          driver_name: values[0] || undefined,
          trip_date: values[1] || undefined,
          distance_km: distance,
        })
      }}
      onDelete={onDelete}
      isSaving={isUpdating}
    />
  )
}
