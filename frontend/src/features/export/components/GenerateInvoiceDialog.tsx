import { useState, useRef } from 'react'
import {
  FileDown,
  Loader2,
  Plus,
  Trash2,
  Search,
  ChevronDown,
  Upload,
  Inbox,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useGenerateInvoice } from '../hooks/useGenerateInvoice'
import { useProjectLineItems } from '../hooks/useProjectLineItems'
import type { Project } from '@/features/project/hooks/useProjects'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function todayFormatted(): string {
  return new Date().toLocaleDateString('nb-NO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function calcLineTotal(
  price: string,
  quantity: string,
  discount: string,
): number {
  const p = parseFloat(price) || 0
  const q = parseFloat(quantity) || 0
  const d = parseFloat(discount) || 0
  return p * q * (1 - d / 100)
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function GenerateInvoiceDialog({
  open,
  onOpenChange,
  project,
}: Props) {
  const { generate, isPending, error } = useGenerateInvoice()
  const { lineItems, isLoading, updateLineItem, removeLineItem, addLine } =
    useProjectLineItems(project.id, open)

  // Invoice fields
  const [daysUntilDue, setDaysUntilDue] = useState(14)
  const [bankAccount, setBankAccount] = useState('')
  const [comment, setComment] = useState('')

  // Customer fields
  const [customerName, setCustomerName] = useState(project.customer_name ?? '')
  const [ourReference, setOurReference] = useState('')
  const [theirReference, setTheirReference] = useState('')
  const [orderReference, setOrderReference] = useState('')

  // Attachments
  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault()
    setAttachments((prev) => [...prev, ...Array.from(e.dataTransfer.files)])
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    setAttachments((prev) => [...prev, ...Array.from(e.target.files ?? [])])
  }

  const totalDiscount = lineItems.reduce((sum, item) => {
    const p = parseFloat(item.price) || 0
    const q = parseFloat(item.quantity) || 0
    const d = parseFloat(item.discount) || 0
    return sum + p * q * (d / 100)
  }, 0)

  const grandTotal = lineItems.reduce(
    (sum, item) =>
      sum + calcLineTotal(item.price, item.quantity, item.discount),
    0,
  )

  async function handleGenerate() {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + daysUntilDue)

    await generate(project.id, {
      format_type: 'aggregated',
      due_date: dueDate.toISOString().split('T')[0],
      bank_account: bankAccount || undefined,
      our_reference: ourReference || undefined,
      their_reference: theirReference || undefined,
      customer_name: customerName || undefined,
      line_items: lineItems
        .filter((item) => item.description.trim() !== '')
        .map((item) => ({
          description: item.description,
          quantity: parseFloat(item.quantity) || 1,
          unit: item.unit,
          unit_price_kr: parseFloat(item.price) || 0,
          discount_percent: parseFloat(item.discount) || 0,
        })),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[95vw] max-h-[95vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <DialogTitle className="text-base font-semibold text-gray-900">
              Generer EHF-faktura
            </DialogTitle>
            <p className="text-xs text-gray-400 mt-0.5">{project.name}</p>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Top row: Faktura + Kunde cards */}
          <div className="grid grid-cols-2 gap-5">
            {/* ── Faktura card ── */}
            <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
              <h2 className="text-base font-semibold text-gray-900">Faktura</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">
                    Dager til forfall
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={daysUntilDue}
                    onChange={(e) => setDaysUntilDue(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">Dato</Label>
                  <div className="flex items-center h-9 px-3 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-500">
                    {todayFormatted()}
                    <span className="ml-1 text-xs text-blue-500 cursor-pointer">
                      (endre)
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">
                  Kontonummer{' '}
                  <span className="text-blue-500 cursor-pointer">
                    endre standard
                  </span>
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      className="pr-8"
                    />
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {!bankAccount && (
                  <span className="inline-block text-xs bg-red-500 text-white rounded px-1.5 py-0.5">
                    Påkrevd
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">
                  Kommentar{' '}
                  <span className="text-blue-500 cursor-pointer">
                    endre standard
                  </span>
                </Label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[80px] resize-y"
                />
              </div>
            </div>

            {/* ── Kunde card ── */}
            <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
              <h2 className="text-base font-semibold text-gray-900">Kunde</h2>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">Kunde</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="Velg kontakt"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="pl-8 pr-8"
                  />
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                {!customerName && (
                  <span className="inline-block text-xs bg-red-500 text-white rounded px-1.5 py-0.5">
                    Påkrevd
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">Vår referanse</Label>
                  <Input
                    placeholder="Referanse (ikke påkrevd)"
                    value={ourReference}
                    onChange={(e) => setOurReference(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">
                    Deres referanse
                  </Label>
                  <Input
                    placeholder="Referanse (ikke påkrevd)"
                    value={theirReference}
                    onChange={(e) => setTheirReference(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">Ordrereferanse</Label>
                <Input
                  placeholder="Referanse (ikke påkrevd)"
                  value={orderReference}
                  onChange={(e) => setOrderReference(e.target.value)}
                />
              </div>

              <div className="flex justify-end pt-1">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  Legg til flere kunder
                </Button>
              </div>
            </div>
          </div>

          {/* ── Fakturalinjer ── */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
            <h2 className="text-base font-semibold text-gray-900">
              Fakturalinjer
            </h2>

            {isLoading ? (
              <div className="flex items-center gap-2 py-6 justify-center text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Laster linjer fra prosjektet…
              </div>
            ) : (
              <>
                {/* Table header */}
                <div className="grid grid-cols-[1fr_110px_90px_110px_80px_36px] gap-2 px-1">
                  <span className="text-xs font-medium text-gray-500">
                    Beskrivelse
                  </span>
                  <span className="text-xs font-medium text-gray-500 text-right">
                    Enhetspris
                  </span>
                  <span className="text-xs font-medium text-gray-500 text-right">
                    Antall
                  </span>
                  <span className="text-xs font-medium text-gray-500 text-right">
                    Rabatt
                  </span>
                  <span className="text-xs font-medium text-gray-500 text-right">
                    Total
                  </span>
                  <span />
                </div>

                {/* Rows */}
                <div className="space-y-2">
                  {lineItems.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr_110px_90px_110px_80px_36px] gap-2 items-center"
                    >
                      {/* Description */}
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(item.id, {
                            description: e.target.value,
                          })
                        }
                        placeholder="Beskrivelse"
                        className="text-sm"
                      />

                      {/* Unit price */}
                      <Input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) =>
                          updateLineItem(item.id, { price: e.target.value })
                        }
                        className="text-right text-sm"
                      />

                      {/* Quantity */}
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={item.quantity}
                          onChange={(e) =>
                            updateLineItem(item.id, {
                              quantity: e.target.value,
                            })
                          }
                          className="text-right pr-9 text-sm"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                          {item.unit}
                        </span>
                      </div>

                      {/* Discount */}
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(e) =>
                            updateLineItem(item.id, {
                              discount: e.target.value,
                            })
                          }
                          className="text-right pr-7 text-sm"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                          %
                        </span>
                      </div>

                      {/* Row total */}
                      <span className="text-sm text-right tabular-nums text-gray-700">
                        {calcLineTotal(
                          item.price,
                          item.quantity,
                          item.discount,
                        ).toLocaleString('nb-NO', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-300 hover:text-red-500"
                        onClick={() => removeLineItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Footer row */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={addLine}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Ny linje
                    </Button>
                  </div>

                  <div className="flex items-center gap-5 text-xs text-gray-500">
                    <span>
                      Total rabatt:{' '}
                      <span className="text-gray-700 tabular-nums">
                        {totalDiscount.toLocaleString('nb-NO', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-gray-900 tabular-nums">
                      {grandTotal.toLocaleString('nb-NO', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Vedlegg ── */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 w-1/2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Upload className="h-4 w-4 text-gray-500" />
                Vedlegg
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs gap-1">
                  <Inbox className="h-3.5 w-3.5" />
                  Hent fra innboks
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Last opp
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-center cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <p className="text-xs text-gray-400">
                Dra og slipp filer, lim inn, last opp eller hent fra innboks
              </p>
            </div>

            {attachments.length > 0 && (
              <ul className="space-y-1">
                {attachments.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between text-xs text-gray-600"
                  >
                    <span>{f.name}</span>
                    <button
                      className="text-gray-400 hover:text-red-500 ml-2"
                      onClick={() =>
                        setAttachments((prev) => prev.filter((_, j) => j !== i))
                      }
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={isPending}>
              Lagre utkast
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              className="text-red-500 hover:text-red-600 hover:border-red-300"
            >
              Slett utkast
            </Button>
            <button
              className="text-sm text-blue-500 hover:underline ml-1"
              onClick={() => onOpenChange(false)}
            >
              Fakturaoversikten
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={isPending}>
              Forhåndsvisning
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isPending}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Genererer…
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  Opprett faktura
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
