/**
 * DataTable column config for material rows.
 * Exports MaterialRow (UI view-model) and materialColumns. Both InvoiceGroupCard
 * (post-confirm) and InvoicePreview (pre-confirm) map their domain rows into
 * MaterialRow and feed this same column array.
 */
import { type Column } from '@/widgets/DataTable'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import EpdBadge from './components/EpdBadge'

export interface MaterialRow {
  name: string | null
  nobb_number: string | null
  gtin: string | null
  quantity: number | null
  unit: string | null
  line_total: number | null
  co2_kg: number | null
  flagged: boolean
  enriched: boolean
  has_epd: boolean
  manual_override: boolean
}

export const materialColumns: Column<MaterialRow>[] = [
  {
    header: 'Navn',
    width: '40%',
    render: (row) => {
      const hasIds = row.gtin || row.nobb_number
      const name = (
        <span className="text-gray-800">
          {row.name ?? '—'}
          {row.flagged && !row.manual_override && (
            <span className="ml-2 inline-block rounded bg-amber-200 px-1.5 py-0.5 text-xs font-medium text-amber-800">
              {row.enriched ? 'Mangler EPD' : 'Mangler ID'}
            </span>
          )}
          {row.manual_override && (
            <span className="ml-2 inline-block rounded bg-blue-200 px-1.5 py-0.5 text-xs font-medium text-blue-800">
              Korrigert
            </span>
          )}
        </span>
      )
      if (!hasIds) return name
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="text-left">{name}</TooltipTrigger>
            <TooltipContent>
              {row.nobb_number && `NOBB: ${row.nobb_number}`}
              {row.nobb_number && row.gtin && ' · '}
              {row.gtin && `GTIN: ${row.gtin}`}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    },
  },
  {
    header: 'Antall',
    width: '12%',
    align: 'right',
    render: (row) => (
      <span className="text-gray-800">{row.quantity ?? '—'}</span>
    ),
    editable: {
      type: 'number',
      getValue: (row) => (row.quantity != null ? String(row.quantity) : ''),
    },
  },
  {
    header: 'Enhet',
    width: '10%',
    render: (row) => <span className="text-gray-600">{row.unit ?? '—'}</span>,
  },
  {
    header: 'Sum',
    width: '12%',
    align: 'right',
    render: (row) => (
      <span className="text-gray-800">
        {row.line_total != null ? row.line_total.toFixed(2) : '—'}
      </span>
    ),
  },
  {
    header: 'CO₂ (kg)',
    width: '10%',
    align: 'right',
    render: (row) => (
      <span className={row.co2_kg == null ? 'text-gray-400' : 'text-gray-800'}>
        {row.co2_kg != null ? row.co2_kg.toFixed(2) : '—'}
      </span>
    ),
    editable: {
      type: 'number',
      getValue: (row) => (row.co2_kg != null ? String(row.co2_kg) : ''),
    },
  },
  {
    header: 'EPD',
    width: '8%',
    render: (row) => <EpdBadge enriched={row.enriched} hasEpd={row.has_epd} />,
  },
]
