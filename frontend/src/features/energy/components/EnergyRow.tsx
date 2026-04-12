import EditableRow, { type GroupColumn } from '@/shared/components/EditableRow'
import type { EnergyEntry, EnergyUpdateInput, PriceZone } from '../types/energy'

interface EnergyRowProps {
  entry: EnergyEntry
  zones: { value: string; label: string }[] | undefined
  onUpdate: (data: EnergyUpdateInput) => void
  onDelete: () => void
  isUpdating: boolean
}

const INPUT = 'w-full rounded border border-gray-300 px-2 py-1 text-sm'

function getColumns(
  zones: { value: string; label: string }[] | undefined,
): GroupColumn<EnergyEntry>[] {
  return [
    {
      header: 'kWh',
      render: (e) => (
        <span className="font-medium text-gray-900">
          {e.kwh_used?.toLocaleString('nb-NO', { maximumFractionDigits: 1 })}
        </span>
      ),
      editRender: (value, onChange) => (
        <input
          type="number"
          min="0"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${INPUT} w-24`}
          autoFocus
        />
      ),
    },
    {
      header: 'Prisområde',
      render: (e) => (
        <span className="text-gray-600">{e.price_zone ?? '—'}</span>
      ),
      editRender: (value, onChange) => (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${INPUT} w-20`}
        >
          <option value="">—</option>
          {zones?.map((z) => (
            <option key={z.value} value={z.value}>
              {z.value}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: 'CO₂ (kg)',
      render: (e) => (
        <span className="text-gray-600">
          {e.total_co2_kg?.toLocaleString('nb-NO', {
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      header: 'Dato',
      render: (e) => (
        <span className="text-gray-500">
          {e.recorded_date
            ? new Date(e.recorded_date + 'T00:00:00').toLocaleDateString(
                'nb-NO',
              )
            : '—'}
        </span>
      ),
      editRender: (value, onChange) => (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={INPUT}
        />
      ),
    },
  ]
}

export default function EnergyRow({
  entry,
  zones,
  onUpdate,
  onDelete,
  isUpdating,
}: EnergyRowProps) {
  const columns = getColumns(zones)

  return (
    <EditableRow
      row={entry}
      columns={columns}
      getEditValues={(e) => ({
        0: String(e.kwh_used ?? ''),
        1: e.price_zone ?? '',
        3: e.recorded_date ?? '',
      })}
      onSave={(values) => {
        const kwh = parseFloat(values[0])
        if (isNaN(kwh) || kwh < 0) return
        onUpdate({
          kwh_used: kwh,
          price_zone: (values[1] as PriceZone) || null,
          recorded_date: values[3] || null,
        })
      }}
      onDelete={onDelete}
      isSaving={isUpdating}
    />
  )
}
