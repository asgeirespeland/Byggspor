/**
 * Waste DataTable columns + WasteRow view-model; shared by WastePreview and WasteGroupCard.
 * Holds a local CO2_SOURCE_LABELS map (epd_c3c4 → 'EPD', fraction_factor → 'Generisk').
 */
import type { EditableColumn } from '@/shared/types/tableColumn'

const CO2_SOURCE_LABELS: Record<string, string> = {
  epd_c3c4: 'EPD',
  fraction_factor: 'Generisk',
}

export interface WasteRow {
  name: string | null
  fraction_code: string | null
  quantity: number | null
  unit: string | null
  co2_kg: number | null
  co2_source: string | null
  flagged: boolean
}

export const wasteColumns: EditableColumn<WasteRow>[] = [
  {
    header: 'Materiale',
    width: '30%',
    render: (row) => (
      <span className="text-gray-800">
        {row.name ?? '—'}
        {row.fraction_code && (
          <span className="ml-1 text-xs text-gray-400">
            ({row.fraction_code})
          </span>
        )}
      </span>
    ),
    editable: {
      type: 'text',
      getValue: (row) => row.name ?? '',
    },
  },
  {
    header: 'Antall',
    width: '15%',
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
    render: (row) => <span className="text-gray-600">{row.unit ?? '—'}</span>,
  },
  {
    header: 'CO₂ (kg)',
    width: '15%',
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
    header: 'Kilde',
    width: '20%',
    render: (row) => (
      <span className="text-gray-600">
        {row.co2_source
          ? (CO2_SOURCE_LABELS[row.co2_source] ?? row.co2_source)
          : '—'}
      </span>
    ),
  },
]
