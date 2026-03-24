import { useState } from 'react'
import { Check, Loader2, Maximize2, Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { InvoiceResponse, LineItem } from '../types/invoice'
import { getGwpA1A3 } from '../utils'
import EpdBadge from './EpdBadge'

interface Props {
  data: InvoiceResponse
  onConfirm: (overrides: Record<string, { total_co2_kg: number }>) => void
  confirming: boolean
  onCancel: () => void
}

function computeCo2(item: LineItem): number | null {
  const gwp = getGwpA1A3(item)
  if (gwp == null) return null
  return gwp * (item.quantity ?? 1)
}

export default function InvoicePreviewTable({
  data,
  onConfirm,
  confirming,
  onCancel,
}: Props) {
  // CO₂ overrides keyed by line index (string key)
  const [overrides, setOverrides] = useState<
    Record<string, { total_co2_kg: number }>
  >({})
  // Tracks which non-flagged row is being edited via pencil click
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  // Tracks pending typed values for flagged inline inputs (not yet confirmed)
  const [pendingInputs, setPendingInputs] = useState<Record<string, string>>({})
  const [fullscreen, setFullscreen] = useState(false)

  const startEdit = (idx: number) => {
    setEditingIdx(idx)
    const existing = overrides[String(idx)]?.total_co2_kg
    setEditValue(existing != null ? String(existing) : '')
  }

  const saveEdit = (idx: number) => {
    const val = parseFloat(editValue)
    if (isNaN(val)) return
    setOverrides((prev) => ({
      ...prev,
      [String(idx)]: { total_co2_kg: val },
    }))
    setEditingIdx(null)
    setEditValue('')
  }

  const cancelEdit = () => {
    setEditingIdx(null)
    setEditValue('')
  }

  const commitInlineInput = (idx: number) => {
    const raw = pendingInputs[String(idx)]
    const val = parseFloat(raw)
    if (isNaN(val)) return
    setOverrides((prev) => ({
      ...prev,
      [String(idx)]: { total_co2_kg: val },
    }))
    setPendingInputs((prev) => {
      const next = { ...prev }
      delete next[String(idx)]
      return next
    })
  }

  const flaggedCount = data.line_items.filter((i) => i.flagged).length
  const totalLines = data.line_items.length
  const overrideCount = Object.keys(overrides).length

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
            <tbody className="divide-y divide-gray-100">
              {data.line_items.map((item, idx) => {
                const override = overrides[String(idx)]
                const autoCo2 = computeCo2(item)
                const displayCo2 = override?.total_co2_kg ?? autoCo2
                const isEditing = editingIdx === idx
                const needsAttention = item.flagged && !override

                return (
                  <tr
                    key={item.line_number ?? idx}
                    className={
                      override
                        ? 'bg-blue-50/50'
                        : needsAttention
                          ? 'bg-amber-50'
                          : 'bg-white'
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
                    <td className="px-4 py-3 text-gray-600">
                      {item.unit ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-800">
                      {item.line_total != null
                        ? item.line_total.toFixed(2)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {needsAttention && displayCo2 == null ? (
                        /* Flagged + no CO₂: show input directly */
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
                              if (e.key === 'Enter') commitInlineInput(idx)
                            }}
                            className="h-7 w-24 rounded border border-gray-900 bg-white px-2 text-xs text-right placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                          />
                          {pendingInputs[String(idx)] && (
                            <button
                              onClick={() => commitInlineInput(idx)}
                              className="flex h-6 w-6 items-center justify-center rounded bg-amber-500 text-white hover:bg-amber-600"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ) : isEditing ? (
                        /* Editing an existing value via pencil */
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step="any"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-7 w-20 rounded border border-gray-200 px-2 text-xs text-right focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(idx)
                              if (e.key === 'Escape') cancelEdit()
                            }}
                          />
                          <button
                            onClick={() => saveEdit(idx)}
                            className="flex h-6 w-6 items-center justify-center rounded bg-blue-500 text-white hover:bg-blue-600"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        /* Has a value: show it with hover pencil */
                        <span className="group inline-flex items-center gap-1">
                          <span
                            className={
                              displayCo2 == null
                                ? 'text-gray-400'
                                : 'text-gray-800'
                            }
                          >
                            {displayCo2 != null ? displayCo2.toFixed(2) : '—'}
                          </span>
                          <button
                            onClick={() => startEdit(idx)}
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
              })}
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

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="sm:max-w-[80vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Forhåndsvisning
              {data.supplier?.name && ` — ${data.supplier.name}`}
              {data.invoice_number && ` #${data.invoice_number}`}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
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
              <tbody className="divide-y divide-gray-100">
                {data.line_items.map((item, idx) => {
                  const override = overrides[String(idx)]
                  const autoCo2 = computeCo2(item)
                  const displayCo2 = override?.total_co2_kg ?? autoCo2
                  return (
                    <tr
                      key={item.line_number ?? idx}
                      className={
                        override
                          ? 'bg-blue-50/50'
                          : item.flagged && !override
                            ? 'bg-amber-50'
                            : 'bg-white'
                      }
                    >
                      <td className="px-4 py-3 text-gray-800">
                        {item.name ?? '—'}
                        {item.flagged && !override && !item.enriched && (
                          <span className="ml-2 inline-block rounded bg-amber-200 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                            Mangler ID
                          </span>
                        )}
                        {item.flagged && !override && item.enriched && (
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
                      <td className="px-4 py-3 text-gray-600">
                        {item.unit ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-800">
                        {item.line_total != null
                          ? item.line_total.toFixed(2)
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={
                            displayCo2 == null
                              ? 'text-gray-400'
                              : 'text-gray-800'
                          }
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
                })}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
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
