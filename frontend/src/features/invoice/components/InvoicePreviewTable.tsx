import { useState } from 'react'
import { Loader2, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import FullscreenDialog from '@/shared/components/FullscreenDialog'
import type { InvoiceResponse, LineItem } from '../types/invoice'
import { getGwpA1A3 } from '../utils'
import { useOverrides } from '../hooks/useOverrides'
import InvoicePreviewRow, { InvoiceFullscreenRow } from './InvoicePreviewRow'

interface Props {
  data: InvoiceResponse
  onConfirm: (overrides: Record<string, { total_co2_kg: number }>) => void
  confirming: boolean
  onCancel: () => void
}

const THEAD = (
  <thead className="border-b border-gray-200 bg-gray-50">
    <tr>
      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Navn
      </th>
      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
        GTIN
      </th>
      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
        NOBB
      </th>
      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
        Antall
      </th>
      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Enhet
      </th>
      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
        Sum
      </th>
      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
        CO₂ (kg)
      </th>
      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
        EPD
      </th>
    </tr>
  </thead>
)

export default function InvoicePreviewTable({
  data,
  onConfirm,
  confirming,
  onCancel,
}: Props) {
  const {
    overrides,
    editingIdx,
    editValue,
    setEditValue,
    pendingInputs,
    setPendingInputs,
    startEdit,
    saveEdit,
    cancelEdit,
    commitInlineInput,
  } = useOverrides()

  const [fullscreen, setFullscreen] = useState(false)

  const flaggedCount = data.line_items.filter((i) => i.flagged).length
  const totalLines = data.line_items.length
  const overrideCount = Object.keys(overrides).length

  const fullscreenTitle = [
    'Forhåndsvisning',
    data.supplier?.name && ` — ${data.supplier.name}`,
    data.invoice_number && ` #${data.invoice_number}`,
  ]
    .filter(Boolean)
    .join('')

  return (
    <>
      <div className="space-y-4">
        {/* Invoice metadata */}
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

        {/* Summary badges */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {totalLines} linjer
          </span>
          {flaggedCount > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
              {flaggedCount} uten CO₂-data
            </span>
          )}
          {overrideCount > 0 && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
              {overrideCount} manuelt korrigert
            </span>
          )}
          <button
            onClick={() => setFullscreen(true)}
            className="ml-auto text-gray-300 hover:text-gray-500 transition-colors"
            title="Utvid"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left text-sm">
            {THEAD}
            <tbody className="divide-y divide-gray-100">
              {data.line_items.map((item, idx) => (
                <InvoicePreviewRow
                  key={item.line_number ?? idx}
                  item={item}
                  idx={idx}
                  override={overrides[String(idx)]}
                  editingIdx={editingIdx}
                  editValue={editValue}
                  setEditValue={setEditValue}
                  pendingInputs={pendingInputs}
                  setPendingInputs={setPendingInputs}
                  onStartEdit={startEdit}
                  onSaveEdit={saveEdit}
                  onCancelEdit={cancelEdit}
                  onCommitInlineInput={commitInlineInput}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Confirm bar */}
        <div className="flex flex-wrap items-center gap-3">
          <TotalCo2Summary items={data.line_items} overrides={overrides} />
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onCancel}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Avbryt
            </button>
            <Button onClick={() => onConfirm(overrides)} disabled={confirming}>
              {confirming ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Lagrer…
                </>
              ) : (
                'Bekreft og lagre'
              )}
            </Button>
          </div>
        </div>
      </div>

      <FullscreenDialog
        open={fullscreen}
        onOpenChange={setFullscreen}
        title={fullscreenTitle}
      >
        <table className="w-full text-left text-sm">
          {THEAD}
          <tbody className="divide-y divide-gray-100">
            {data.line_items.map((item, idx) => (
              <InvoiceFullscreenRow
                key={item.line_number ?? idx}
                item={item}
                idx={idx}
                override={overrides[String(idx)]}
              />
            ))}
          </tbody>
        </table>
      </FullscreenDialog>
    </>
  )
}

function TotalCo2Summary({
  items,
  overrides,
}: {
  items: LineItem[]
  overrides: Record<string, { total_co2_kg: number }>
}) {
  let total = 0
  let count = 0
  for (let i = 0; i < items.length; i++) {
    const override = overrides[String(i)]
    if (override) {
      total += override.total_co2_kg
      count++
    } else {
      const gwp = getGwpA1A3(items[i])
      if (gwp != null) {
        total += gwp * (items[i].quantity ?? 1)
        count++
      }
    }
  }
  if (count === 0) return null
  return (
    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
      CO₂: {total.toFixed(2)} kg ({count}/{items.length} linjer)
    </span>
  )
}
