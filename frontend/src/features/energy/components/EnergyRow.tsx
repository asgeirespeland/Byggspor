import { Pencil, Trash2, Check, X } from 'lucide-react'
import { useInlineEdit } from '@/shared/hooks/useInlineEdit'
import type { EnergyEntry, EnergyUpdateInput, PriceZone } from '../types/energy'

interface EnergyRowProps {
  entry: EnergyEntry
  zones: { value: string; label: string }[] | undefined
  onUpdate: (data: EnergyUpdateInput) => void
  onDelete: () => void
  isUpdating: boolean
  isDeleting: boolean
}

export default function EnergyRow({
  entry,
  zones,
  onUpdate,
  onDelete,
  isUpdating,
  isDeleting,
}: EnergyRowProps) {
  const { editing, value, setValue, startEdit, cancelEdit } = useInlineEdit({
    kwh: '',
    zone: '',
    date: '',
  })

  const handleStartEdit = () =>
    startEdit({
      kwh: String(entry.kwh_used ?? ''),
      zone: entry.price_zone ?? '',
      date: entry.recorded_date ?? '',
    })

  const saveEdit = () => {
    const kwh = parseFloat(value.kwh)
    if (isNaN(kwh) || kwh < 0) return

    onUpdate({
      kwh_used: kwh,
      price_zone: (value.zone as PriceZone) || null,
      recorded_date: value.date || null,
    })
    cancelEdit()
  }

  if (editing) {
    return (
      <tr className="bg-blue-50/40">
        <td className="px-4 py-1.5">
          <input
            type="number"
            min="0"
            step="any"
            value={value.kwh}
            onChange={(e) => setValue((v) => ({ ...v, kwh: e.target.value }))}
            className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
            autoFocus
          />
        </td>
        <td className="px-4 py-1.5">
          <select
            value={value.zone}
            onChange={(e) => setValue((v) => ({ ...v, zone: e.target.value }))}
            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="">—</option>
            {zones?.map((z) => (
              <option key={z.value} value={z.value}>
                {z.value}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-1.5 text-gray-400 text-xs">auto</td>
        <td className="px-4 py-1.5">
          <input
            type="date"
            value={value.date}
            onChange={(e) => setValue((v) => ({ ...v, date: e.target.value }))}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </td>
        <td className="px-4 py-1.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={saveEdit}
              disabled={isUpdating}
              className="text-emerald-600 hover:text-emerald-800"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-2.5 font-medium text-gray-900">
        {entry.kwh_used?.toLocaleString('nb-NO', {
          maximumFractionDigits: 1,
        })}
      </td>
      <td className="px-4 py-2.5 text-gray-600">{entry.price_zone ?? '—'}</td>
      <td className="px-4 py-2.5 text-gray-600">
        {entry.total_co2_kg?.toLocaleString('nb-NO', {
          maximumFractionDigits: 2,
        })}
      </td>
      <td className="px-4 py-2.5 text-gray-500">
        {entry.recorded_date
          ? new Date(entry.recorded_date + 'T00:00:00').toLocaleDateString(
              'nb-NO',
            )
          : '—'}
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleStartEdit}
            className="text-gray-400 transition-colors hover:text-blue-500 cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="text-gray-400 transition-colors hover:text-red-500 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}
