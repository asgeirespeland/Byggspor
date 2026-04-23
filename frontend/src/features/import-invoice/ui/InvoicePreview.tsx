import { useMemo } from 'react'
import ParsePreviewShell from '@/widgets/file-upload/ParsePreviewShell'
import Co2TotalBadge from '@/widgets/Co2TotalBadge'
import type { InvoiceResponse } from '@/entities/materials/types'
import { getGwpA1A3 } from '@/entities/materials/lib/utils'
import {
  materialColumns,
  type MaterialRow,
} from '@/entities/materials/ui/columns'

interface Props {
  data: InvoiceResponse
  setData: (data: InvoiceResponse) => void
  onConfirm: () => void
  confirming: boolean
  onCancel: () => void
}

export default function InvoicePreview({
  data,
  setData,
  onConfirm,
  confirming,
  onCancel,
}: Props) {
  const rows: MaterialRow[] = useMemo(
    () =>
      data.line_items.map((item) => {
        const gwp = getGwpA1A3(item)
        return {
          name: item.name,
          nobb_number: item.nobb_number,
          gtin: item.gtin,
          quantity: item.quantity,
          unit: item.unit,
          line_total: item.line_total,
          co2_kg: gwp != null ? gwp * (item.quantity ?? 1) : null,
          flagged: item.flagged,
          enriched: item.enriched,
          has_epd: item.nobb_data?.has_epd ?? false,
          manual_override: false,
        }
      }),
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
    'Forhåndsvisning',
    data.supplier?.name && ` — ${data.supplier.name}`,
    data.invoice_number && ` #${data.invoice_number}`,
  ]
    .filter(Boolean)
    .join('')

  return (
    <ParsePreviewShell
      columns={materialColumns}
      rows={rows}
      rowKey={(_, i) => data.line_items[i].line_number ?? i}
      rowClassName={(row) => (row.flagged ? 'bg-warning-soft' : '')}
      onSaveEdit={(_row, i, values) => {
        const items = [...data.line_items]
        items[i] = {
          ...items[i],
          quantity: values[1] ? parseFloat(values[1]) : null,
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
          {data.invoice_number && (
            <span>
              <span className="font-medium text-gray-800">Faktura:</span>{' '}
              {data.invoice_number}
            </span>
          )}
          {data.issue_date && (
            <span>
              <span className="font-medium text-gray-800">Dato:</span>{' '}
              {data.issue_date}
            </span>
          )}
          {data.supplier?.name && (
            <span>
              <span className="font-medium text-gray-800">Leverandør:</span>{' '}
              {data.supplier.name}
            </span>
          )}
        </div>
      }
      badges={
        <>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {rows.length} linjer
          </span>
          {flaggedCount > 0 && (
            <span className="rounded-full bg-warning-soft px-3 py-1 text-xs font-medium text-warning-strong">
              {flaggedCount} uten CO₂-data
            </span>
          )}
        </>
      }
      fullscreenTitle={fullscreenTitle}
      co2Summary={
        <Co2TotalBadge total={co2Total} count={co2Count} label="linjer" />
      }
      onConfirm={onConfirm}
      onCancel={onCancel}
      confirming={confirming}
    />
  )
}
