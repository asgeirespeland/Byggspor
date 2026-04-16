import ParsePreviewShell, {
  type Column,
} from '@/shared/components/ParsePreviewShell'
import Co2TotalBadge from '@/shared/components/Co2TotalBadge'
import type { InvoiceResponse, LineItem } from '../types/invoice'
import { getGwpA1A3 } from '../utils'
import EpdBadge from './EpdBadge'

interface Props {
  data: InvoiceResponse
  setData: (data: InvoiceResponse) => void
  onConfirm: () => void
  confirming: boolean
  onCancel: () => void
}

const INPUT =
  'w-full rounded border border-gray-300 px-2 text-sm h-7 focus:outline-none focus:ring-1 focus:ring-gray-400'

const columns: Column<LineItem>[] = [
  {
    header: 'Navn',
    width: '28%',
    render: (item) => (
      <span className="text-gray-800">
        {item.name ?? '—'}
        {item.flagged && (
          <span className="ml-2 inline-block rounded bg-amber-200 px-1.5 py-0.5 text-xs font-medium text-amber-800">
            {item.enriched ? 'Mangler EPD' : 'Mangler ID'}
          </span>
        )}
      </span>
    ),
  },
  {
    header: 'GTIN',
    width: '12%',
    render: (item) => (
      <span className="text-gray-600 font-mono text-xs">
        {item.gtin ?? '—'}
      </span>
    ),
  },
  {
    header: 'NOBB',
    width: '10%',
    render: (item) => (
      <span className="text-gray-600 font-mono text-xs">
        {item.nobb_number ?? '—'}
      </span>
    ),
  },
  {
    header: 'Antall',
    width: '8%',
    align: 'right',
    render: (item) => (
      <span className="text-gray-800">{item.quantity ?? '—'}</span>
    ),
    editRender: (_row, _i, value, onChange) => (
      <input
        type="number"
        min="0"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT} text-right`}
      />
    ),
  },
  {
    header: 'Enhet',
    width: '7%',
    render: (item) => <span className="text-gray-600">{item.unit ?? '—'}</span>,
  },
  {
    header: 'Sum',
    width: '9%',
    align: 'right',
    render: (item) => (
      <span className="text-gray-800">
        {item.line_total != null ? item.line_total.toFixed(2) : '—'}
      </span>
    ),
  },
  {
    header: 'CO₂ (kg)',
    width: '10%',
    align: 'right',
    render: (item) => {
      const gwp = getGwpA1A3(item)
      const co2 = gwp != null ? gwp * (item.quantity ?? 1) : null
      return (
        <span className={co2 == null ? 'text-gray-400' : 'text-gray-800'}>
          {co2 != null ? co2.toFixed(2) : '—'}
        </span>
      )
    },
    editRender: (_row, _i, value, onChange) => (
      <input
        type="number"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT} text-right`}
      />
    ),
  },
  {
    header: 'EPD',
    width: '8%',
    render: (item) => (
      <EpdBadge
        enriched={item.enriched}
        hasEpd={item.nobb_data?.has_epd ?? false}
      />
    ),
  },
]

export default function InvoicePreview({
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
    const gwp = getGwpA1A3(item)
    if (gwp != null) {
      co2Total += gwp * (item.quantity ?? 1)
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
      columns={columns}
      rows={data.line_items}
      rowKey={(item, i) => item.line_number ?? i}
      rowClassName={(item) => (item.flagged ? 'bg-amber-50' : '')}
      getEditValues={(item) => ({
        3: item.quantity != null ? String(item.quantity) : '',
        6: (() => {
          const gwp = getGwpA1A3(item)
          return gwp != null ? String(gwp * (item.quantity ?? 1)) : ''
        })(),
      })}
      onSaveEdit={(_row, i, values) => {
        const items = [...data.line_items]
        items[i] = {
          ...items[i],
          quantity: values[3] ? parseFloat(values[3]) : null,
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
            {data.line_items.length} linjer
          </span>
          {flaggedCount > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
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
