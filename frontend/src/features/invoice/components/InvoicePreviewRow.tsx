import { Check, Pencil, X } from 'lucide-react'
import type { LineItem } from '../types/invoice'
import { getGwpA1A3 } from '../utils'
import EpdBadge from './EpdBadge'

function computeCo2(item: LineItem): number | null {
  const gwp = getGwpA1A3(item)
  if (gwp == null) return null
  return gwp * (item.quantity ?? 1)
}

interface InvoicePreviewRowProps {
  item: LineItem
  idx: number
  override: { total_co2_kg: number } | undefined
  editingIdx: number | null
  editValue: string
  setEditValue: (v: string) => void
  pendingInputs: Record<string, string>
  setPendingInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onStartEdit: (idx: number) => void
  onSaveEdit: (idx: number) => void
  onCancelEdit: () => void
  onCommitInlineInput: (idx: number) => void
}

export default function InvoicePreviewRow({
  item,
  idx,
  override,
  editingIdx,
  editValue,
  setEditValue,
  pendingInputs,
  setPendingInputs,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onCommitInlineInput,
}: InvoicePreviewRowProps) {
  const autoCo2 = computeCo2(item)
  const displayCo2 = override?.total_co2_kg ?? autoCo2
  const isEditing = editingIdx === idx
  const needsAttention = item.flagged && !override

  return (
    <tr
      key={item.line_number ?? idx}
      className={
        override ? 'bg-blue-50/50' : needsAttention ? 'bg-amber-50' : 'bg-white'
      }
    >
      <td className="px-4 py-3 text-gray-800">
        {item.name ?? '—'}
        {needsAttention && !item.enriched && (
          <span className="ml-2 inline-block rounded bg-amber-200 px-1.5 py-0.5 text-xs font-medium text-amber-800">
            Mangler ID
          </span>
        )}
        {needsAttention && item.enriched && (
          <span className="ml-2 inline-block rounded bg-amber-200 px-1.5 py-0.5 text-xs font-medium text-amber-800">
            Mangler EPD
          </span>
        )}
        {override && (
          <span className="ml-2 inline-block rounded bg-blue-200 px-1.5 py-0.5 text-xs font-medium text-blue-800">
            Korrigert
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-gray-600 font-mono text-xs">
        {item.gtin ?? '—'}
      </td>
      <td className="px-4 py-3 text-gray-600 font-mono text-xs">
        {item.nobb_number ?? '—'}
      </td>
      <td className="px-4 py-3 text-right text-gray-800">
        {item.quantity ?? '—'}
      </td>
      <td className="px-4 py-3 text-gray-600">{item.unit ?? '—'}</td>
      <td className="px-4 py-3 text-right text-gray-800">
        {item.line_total != null ? item.line_total.toFixed(2) : '—'}
      </td>
      <td className="px-4 py-3 text-right">
        {needsAttention && displayCo2 == null ? (
          <div className="flex items-center justify-end gap-1">
            <input
              type="number"
              step="any"
              placeholder="Valgfritt"
              value={pendingInputs[String(idx)] ?? ''}
              onChange={(e) =>
                setPendingInputs((prev) => ({
                  ...prev,
                  [String(idx)]: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') onCommitInlineInput(idx)
              }}
              className="h-7 w-24 rounded border border-gray-900 bg-white px-2 text-xs text-right placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
            {pendingInputs[String(idx)] && (
              <button
                onClick={() => onCommitInlineInput(idx)}
                className="flex h-6 w-6 items-center justify-center rounded bg-amber-500 text-white hover:bg-amber-600"
              >
                <Check className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : isEditing ? (
          <div className="flex items-center justify-end gap-1">
            <input
              type="number"
              step="any"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-7 w-20 rounded border border-gray-200 px-2 text-xs text-right focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit(idx)
                if (e.key === 'Escape') onCancelEdit()
              }}
            />
            <button
              onClick={() => onSaveEdit(idx)}
              className="flex h-6 w-6 items-center justify-center rounded bg-blue-500 text-white hover:bg-blue-600"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              onClick={onCancelEdit}
              className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:text-gray-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <span className="group inline-flex items-center gap-1">
            <span
              className={displayCo2 == null ? 'text-gray-400' : 'text-gray-800'}
            >
              {displayCo2 != null ? displayCo2.toFixed(2) : '—'}
            </span>
            <button
              onClick={() => onStartEdit(idx)}
              className="invisible ml-1 text-gray-300 hover:text-blue-500 group-hover:visible"
              title="Korriger CO₂-verdi"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <EpdBadge
          enriched={item.enriched}
          hasEpd={item.nobb_data?.has_epd ?? false}
        />
      </td>
    </tr>
  )
}

/** Read-only row for the fullscreen dialog view */
export function InvoiceFullscreenRow({
  item,
  idx,
  override,
}: {
  item: LineItem
  idx: number
  override: { total_co2_kg: number } | undefined
}) {
  const autoCo2 = computeCo2(item)
  const displayCo2 = override?.total_co2_kg ?? autoCo2
  const needsAttention = item.flagged && !override

  return (
    <tr
      key={item.line_number ?? idx}
      className={
        override ? 'bg-blue-50/50' : needsAttention ? 'bg-amber-50' : 'bg-white'
      }
    >
      <td className="px-4 py-3 text-gray-800">
        {item.name ?? '—'}
        {needsAttention && !item.enriched && (
          <span className="ml-2 inline-block rounded bg-amber-200 px-1.5 py-0.5 text-xs font-medium text-amber-800">
            Mangler ID
          </span>
        )}
        {needsAttention && item.enriched && (
          <span className="ml-2 inline-block rounded bg-amber-200 px-1.5 py-0.5 text-xs font-medium text-amber-800">
            Mangler EPD
          </span>
        )}
        {override && (
          <span className="ml-2 inline-block rounded bg-blue-200 px-1.5 py-0.5 text-xs font-medium text-blue-800">
            Korrigert
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-gray-600 font-mono text-xs">
        {item.gtin ?? '—'}
      </td>
      <td className="px-4 py-3 text-gray-600 font-mono text-xs">
        {item.nobb_number ?? '—'}
      </td>
      <td className="px-4 py-3 text-right text-gray-800">
        {item.quantity ?? '—'}
      </td>
      <td className="px-4 py-3 text-gray-600">{item.unit ?? '—'}</td>
      <td className="px-4 py-3 text-right text-gray-800">
        {item.line_total != null ? item.line_total.toFixed(2) : '—'}
      </td>
      <td className="px-4 py-3 text-right">
        <span
          className={displayCo2 == null ? 'text-gray-400' : 'text-gray-800'}
        >
          {displayCo2 != null ? displayCo2.toFixed(2) : '—'}
        </span>
      </td>
      <td className="px-4 py-3">
        <EpdBadge
          enriched={item.enriched}
          hasEpd={item.nobb_data?.has_epd ?? false}
        />
      </td>
    </tr>
  )
}
