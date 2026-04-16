import { useMemo } from 'react'
import ParsePreviewShell from '@/shared/components/ParsePreviewShell'
import Co2TotalBadge from '@/shared/components/Co2TotalBadge'
import type { TransportParseResponse } from '../types/transport'
import { tripColumns, type TripRow } from '../tripColumns'

interface Props {
  data: TransportParseResponse
  setData: (data: TransportParseResponse) => void
  onConfirm: () => void
  confirming: boolean
  onCancel: () => void
}

export default function TransportPreview({
  data,
  setData,
  onConfirm,
  confirming,
  onCancel,
}: Props) {
  const rows: TripRow[] = useMemo(
    () =>
      data.trips.map((t) => ({
        driver_name: t.driver_name,
        trip_date: null,
        start_address: t.start_address,
        end_address: t.end_address,
        registration_number: t.registration_number,
        vehicle_make: t.vehicle?.make ?? null,
        distance_km: t.distance_km,
        total_co2_kg: t.total_co2_kg,
        flagged: t.flagged,
      })),
    [data.trips],
  )

  const flaggedCount = rows.filter((r) => r.flagged).length

  let co2Total = 0
  let co2Count = 0
  for (const row of rows) {
    if (row.total_co2_kg != null) {
      co2Total += row.total_co2_kg
      co2Count++
    }
  }

  return (
    <ParsePreviewShell
      columns={tripColumns}
      rows={rows}
      rowKey={(_, i) => data.trips[i].trip_index}
      rowClassName={(row) => (row.flagged ? 'bg-amber-50' : '')}
      onSaveEdit={(_row, i, values) => {
        const trips = [...data.trips]
        trips[i] = {
          ...trips[i],
          driver_name: values[0] || null,
          distance_km: values[4] ? parseFloat(values[4]) : null,
        }
        setData({ ...data, trips })
      }}
      onDeleteRow={(_row, i) => {
        setData({
          ...data,
          trips: data.trips.filter((_, idx) => idx !== i),
        })
      }}
      metadata={
        data.file_name ? (
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
            <span>
              <span className="font-medium text-gray-800">Fil:</span>{' '}
              {data.file_name}
            </span>
          </div>
        ) : undefined
      }
      badges={
        <>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {rows.length} turer
          </span>
          {flaggedCount > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
              {flaggedCount} ufullstendige
            </span>
          )}
        </>
      }
      fullscreenTitle="Transportrapport"
      co2Summary={
        <Co2TotalBadge total={co2Total} count={co2Count} label="turer" />
      }
      onConfirm={onConfirm}
      onCancel={onCancel}
      confirming={confirming}
    />
  )
}
