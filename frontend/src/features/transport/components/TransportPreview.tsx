import ParsePreviewShell, {
  type Column,
} from '@/shared/components/ParsePreviewShell'
import Co2TotalBadge from '@/shared/components/Co2TotalBadge'
import type { TransportParseResponse, Trip } from '../types/transport'

interface Props {
  data: TransportParseResponse
  setData: (data: TransportParseResponse) => void
  onConfirm: () => void
  confirming: boolean
  onCancel: () => void
}

const INPUT = 'w-full rounded border border-gray-300 px-2 py-1 text-sm'

const columns: Column<Trip>[] = [
  {
    header: 'Sjåfør',
    render: (t) => (
      <span className="text-gray-800">{t.driver_name ?? '—'}</span>
    ),
    editRender: (_row, _i, value, onChange) => (
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
    header: 'Rute',
    render: (t) => (
      <span className="text-gray-600">
        {t.start_address && t.end_address
          ? `${t.start_address} → ${t.end_address}`
          : t.start_address || t.end_address || '—'}
      </span>
    ),
  },
  {
    header: 'Reg.nr',
    render: (t) => (
      <span className="font-mono text-xs text-gray-600">
        {t.registration_number}
      </span>
    ),
  },
  {
    header: 'Km',
    align: 'right',
    render: (t) => (
      <span className="text-gray-800">
        {t.distance_km != null ? t.distance_km.toFixed(1) : '—'}
      </span>
    ),
    editRender: (_row, _i, value, onChange) => (
      <input
        type="number"
        min="0"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT} w-24 text-right`}
      />
    ),
  },
  {
    header: 'CO₂ (kg)',
    align: 'right',
    render: (t) => (
      <span className="text-gray-800">
        {t.total_co2_kg != null ? t.total_co2_kg.toFixed(2) : '—'}
      </span>
    ),
  },
  {
    header: 'Status',
    render: (t) => (
      <span
        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
          t.flagged
            ? 'bg-amber-100 text-amber-700'
            : 'bg-emerald-100 text-emerald-700'
        }`}
      >
        {t.flagged ? 'Mangler data' : 'OK'}
      </span>
    ),
  },
]

export default function TransportPreview({
  data,
  setData,
  onConfirm,
  confirming,
  onCancel,
}: Props) {
  const flaggedCount = data.trips.filter((t) => t.flagged).length
  const vehicleCount = new Set(
    data.trips.map((t) => t.vehicle_id).filter(Boolean),
  ).size

  let co2Total = 0
  let co2Count = 0
  for (const trip of data.trips) {
    if (trip.total_co2_kg != null) {
      co2Total += trip.total_co2_kg
      co2Count++
    }
  }

  return (
    <ParsePreviewShell
      columns={columns}
      rows={data.trips}
      rowKey={(t) => t.trip_index}
      rowClassName={(t) => (t.flagged ? 'bg-amber-50' : '')}
      getEditValues={(t) => ({
        0: t.driver_name ?? '',
        3: t.distance_km != null ? String(t.distance_km) : '',
      })}
      onSaveEdit={(_row, i, values) => {
        const trips = [...data.trips]
        trips[i] = {
          ...trips[i],
          driver_name: values[0] || null,
          distance_km: values[3] ? parseFloat(values[3]) : null,
        }
        setData({ ...data, trips })
      }}
      onDeleteRow={(_row, i) => {
        setData({
          ...data,
          trips: data.trips.filter((_, idx) => idx !== i),
        })
      }}
      badges={
        <>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {data.trips.length} turer
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {vehicleCount} kjøretøy
          </span>
          {flaggedCount > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
              {flaggedCount} mangler utslippsdata
            </span>
          )}
        </>
      }
      fullscreenTitle="Transportoversikt"
      co2Summary={
        <Co2TotalBadge total={co2Total} count={co2Count} label="turer" />
      }
      onConfirm={onConfirm}
      onCancel={onCancel}
      confirming={confirming}
    />
  )
}
