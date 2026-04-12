import ParsePreviewShell, {
  type Column,
} from '@/shared/components/ParsePreviewShell'
import Co2TotalBadge from '@/shared/components/Co2TotalBadge'
import type { WasteParseResponse, WasteLineItem } from '../types/waste'

interface Props {
  data: WasteParseResponse
  setData: (data: WasteParseResponse) => void
  onConfirm: () => void
  confirming: boolean
  onCancel: () => void
}

const CO2_SOURCE_LABELS: Record<string, string> = {
  epd_c3c4: 'EPD',
  fraction_factor: 'Generisk',
}

const INPUT = 'w-full rounded border border-gray-300 px-2 py-1 text-sm'

const columns: Column<WasteLineItem>[] = [
  {
    header: 'Materiale',
    render: (item) => (
      <span className="text-gray-800">
        {item.name ?? '—'}
        {item.fraction_code && (
          <span className="ml-1 text-xs text-gray-400">
            ({item.fraction_code})
          </span>
        )}
      </span>
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
    header: 'Tonn',
    align: 'right',
    render: (item) => (
      <span className="text-gray-800">
        {item.quantity_tons?.toFixed(3) ?? '—'}
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
    render: (item) => (
      <span className={item.co2_kg == null ? 'text-gray-400' : 'text-gray-800'}>
        {item.co2_kg != null ? item.co2_kg.toFixed(2) : '—'}
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
    header: 'Kilde',
    render: (item) => (
      <span className="text-gray-600">
        {item.co2_source
          ? (CO2_SOURCE_LABELS[item.co2_source] ?? item.co2_source)
          : '—'}
      </span>
    ),
  },
]

export default function WastePreviewTable({
  data,
  setData,
  onConfirm,
  confirming,
  onCancel,
}: Props) {
  const flaggedCount = data.line_items.filter((i) => i.flagged).length

  let co2Total = 0
  let co2Count = 0
  for (const item of data.line_items) {
    if (item.co2_kg != null) {
      co2Total += item.co2_kg
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
      columns={columns}
      rows={data.line_items}
      rowKey={(_, i) => i}
      rowClassName={(item) => (item.flagged ? 'bg-amber-50' : '')}
      getEditValues={(item) => ({
        0: item.name ?? '',
        1: item.quantity_tons != null ? String(item.quantity_tons) : '',
        2: item.co2_kg != null ? String(item.co2_kg) : '',
      })}
      onSaveEdit={(_row, i, values) => {
        const items = [...data.line_items]
        items[i] = {
          ...items[i],
          name: values[0] || null,
          quantity_tons: values[1] ? parseFloat(values[1]) : null,
          co2_kg: values[2] ? parseFloat(values[2]) : null,
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
            {data.line_items.length} poster
          </span>
          {flaggedCount > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
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
          <p className="text-xs text-amber-600">
            Poster markert med gul bakgrunn mangler CO₂-data og trenger manuell
            gjennomgang.
          </p>
        ) : undefined
      }
    />
  )
}
