/**
 * Trip DataTable column definitions and TripRow view-model; shared by TransportPreview and TransportGroupCard.
 * nb-NO date/number formatting here duplicates report/utils.tsx::fmt — candidate for shared formatters.
 */
import { type Column } from '@/widgets/DataTable'

export interface TripRow {
  driver_name: string | null
  trip_date: string | null
  start_address: string | null
  end_address: string | null
  registration_number: string | null
  vehicle_make: string | null
  distance_km: number | null
  total_co2_kg: number | null
  flagged: boolean
}

export const tripColumns: Column<TripRow>[] = [
  {
    header: 'Sjåfør',
    width: '15%',
    render: (row) => (
      <span className="text-gray-800">{row.driver_name ?? '—'}</span>
    ),
    editable: {
      type: 'text',
      getValue: (row) => row.driver_name ?? '',
    },
  },
  {
    header: 'Dato',
    render: (row) => (
      <span className="text-gray-500 text-xs">
        {row.trip_date
          ? new Date(row.trip_date + 'T00:00:00').toLocaleDateString('nb-NO')
          : '—'}
      </span>
    ),
    editable: {
      type: 'date',
      getValue: (row) => row.trip_date ?? '',
    },
  },
  {
    header: 'Rute',
    width: '25%',
    render: (row) => (
      <span className="text-gray-600">
        {row.start_address && row.end_address
          ? `${row.start_address} → ${row.end_address}`
          : '—'}
      </span>
    ),
  },
  {
    header: 'Reg.nr',
    width: '10%',
    render: (row) => (
      <span className="font-mono text-xs text-gray-600">
        {row.registration_number ?? '—'}
        {row.vehicle_make && (
          <span className="ml-1 text-gray-400">({row.vehicle_make})</span>
        )}
      </span>
    ),
  },
  {
    header: 'Km',
    width: '8%',
    align: 'right',
    render: (row) => (
      <span className="text-gray-800">
        {row.distance_km?.toLocaleString('nb-NO', {
          maximumFractionDigits: 1,
        }) ?? '—'}
      </span>
    ),
    editable: {
      type: 'number',
      getValue: (row) =>
        row.distance_km != null ? String(row.distance_km) : '',
    },
  },
  {
    header: 'CO₂ (kg)',
    width: '10%',
    align: 'right',
    render: (row) => (
      <span className="text-gray-800">
        {row.total_co2_kg?.toLocaleString('nb-NO', {
          maximumFractionDigits: 2,
        }) ?? '—'}
      </span>
    ),
  },
  {
    header: 'Status',
    width: '12%',
    render: (row) => (
      <span
        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
          row.flagged
            ? 'bg-amber-100 text-amber-700'
            : 'bg-emerald-100 text-emerald-700'
        }`}
      >
        {row.flagged ? 'Flagget' : 'OK'}
      </span>
    ),
  },
]
