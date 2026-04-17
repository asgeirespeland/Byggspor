import { useMemo } from 'react'
import ParsePreviewShell from '@/widgets/file-upload/ParsePreviewShell'
import Co2TotalBadge from '@/widgets/Co2TotalBadge'
import type { WasteParseResponse } from '../types'
import { wasteColumns, type WasteRow } from './columns'

interface Props {
  data: WasteParseResponse
  setData: (data: WasteParseResponse) => void
  onConfirm: () => void
  confirming: boolean
  onCancel: () => void
}

export default function WastePreview({
  data,
  setData,
  onConfirm,
  confirming,
  onCancel,
}: Props) {
  const rows: WasteRow[] = useMemo(
    () =>
      data.line_items.map((item) => ({
        name: item.name,
        fraction_code: item.fraction_code,
        quantity: item.quantity,
        unit: item.unit,
        co2_kg: item.co2_kg,
        co2_source: item.co2_source,
        flagged: item.flagged,
      })),
    [data.line_items],
  )

  const flaggedCount = rows.filter((r) => r.flagged).length

  let co2Total = 0
  let co2Count = 0
  for (const row of rows) {
    if (row.co2_kg != null) {
      co2Total += row.co2_kg
      co2Count++
    }
  }

  const fullscreenTitle = [
    'Avfallsrapport',
    data.receiver?.name && ` — ${data.receiver.name}`,
    data.report_id && ` #${data.report_id}`,
  ]
    .filter(Boolean)
    .join('')

  return (
    <ParsePreviewShell
      columns={wasteColumns}
      rows={rows}
      rowKey={(_, i) => i}
      rowClassName={(row) => (row.flagged ? 'bg-warning-soft' : '')}
      onSaveEdit={(_row, i, values) => {
        const items = [...data.line_items]
        items[i] = {
          ...items[i],
          name: values[0] || null,
          quantity: values[1] ? parseFloat(values[1]) : null,
          co2_kg: values[3] ? parseFloat(values[3]) : null,
        }
        setData({ ...data, line_items: items })
      }}
      onDeleteRow={(_row, i) => {
        setData({
          ...data,
          line_items: data.line_items.filter((_, idx) => idx !== i),
        })
      }}
      metadata={
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
          {data.receiver?.name && (
            <span>
              <span className="font-medium text-gray-800">Mottaker:</span>{' '}
              {data.receiver.name}
            </span>
          )}
          {data.issue_date && (
            <span>
              <span className="font-medium text-gray-800">Dato:</span>{' '}
              {data.issue_date}
            </span>
          )}
          {data.report_id && (
            <span>
              <span className="font-medium text-gray-800">Rapport:</span>{' '}
              {data.report_id}
            </span>
          )}
        </div>
      }
      badges={
        <>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {rows.length} poster
          </span>
          {flaggedCount > 0 && (
            <span className="rounded-full bg-warning-soft px-3 py-1 text-xs font-medium text-warning-strong">
              {flaggedCount} mangler CO₂-data
            </span>
          )}
        </>
      }
      fullscreenTitle={fullscreenTitle}
      co2Summary={
        <Co2TotalBadge total={co2Total} count={co2Count} label="poster" />
      }
      onConfirm={onConfirm}
      onCancel={onCancel}
      confirming={confirming}
      afterTable={
        flaggedCount > 0 ? (
          <p className="text-xs text-warning-strong">
            Poster markert med gul bakgrunn mangler CO₂-data og trenger manuell
            gjennomgang.
          </p>
        ) : undefined
      }
    />
  )
}
