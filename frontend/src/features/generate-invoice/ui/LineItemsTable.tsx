import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { calcLineTotal } from '../lib/invoiceHelpers'
import type { LineItem } from '../hooks/useProjectLineItems'

interface Props {
  lineItems: LineItem[]
  isLoading: boolean
  updateLineItem: (id: string, patch: Partial<LineItem>) => void
  removeLineItem: (id: string) => void
  addLine: () => void
}

const GRID = 'grid grid-cols-[1fr_110px_90px_110px_80px_36px] gap-2'
const MONEY_FMT = { minimumFractionDigits: 2, maximumFractionDigits: 2 }

export default function LineItemsTable({
  lineItems,
  isLoading,
  updateLineItem,
  removeLineItem,
  addLine,
}: Props) {
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

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
      <h2 className="text-base font-semibold text-gray-900">Fakturalinjer</h2>

      {isLoading ? (
        <div className="flex items-center gap-2 py-6 justify-center text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Laster linjer fra prosjektet…
        </div>
      ) : (
        <>
          <div className={`${GRID} px-1`}>
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

          <div className="space-y-2">
            {lineItems.map((item) => (
              <div key={item.id} className={`${GRID} items-center`}>
                <Input
                  value={item.description}
                  onChange={(e) =>
                    updateLineItem(item.id, { description: e.target.value })
                  }
                  placeholder="Beskrivelse"
                  className="text-sm"
                />
                <Input
                  type="number"
                  step="0.01"
                  value={item.price}
                  onChange={(e) =>
                    updateLineItem(item.id, { price: e.target.value })
                  }
                  className="text-right text-sm"
                />
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={item.quantity}
                    onChange={(e) =>
                      updateLineItem(item.id, { quantity: e.target.value })
                    }
                    className="text-right pr-9 text-sm"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                    {item.unit}
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={item.discount}
                    onChange={(e) =>
                      updateLineItem(item.id, { discount: e.target.value })
                    }
                    className="text-right pr-7 text-sm"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                    %
                  </span>
                </div>
                <span className="text-sm text-right tabular-nums text-gray-700">
                  {calcLineTotal(
                    item.price,
                    item.quantity,
                    item.discount,
                  ).toLocaleString('nb-NO', MONEY_FMT)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-300 hover:text-danger"
                  onClick={() => removeLineItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={addLine}
            >
              <Plus className="h-3.5 w-3.5" />
              Ny linje
            </Button>

            <div className="flex items-center gap-5 text-xs text-gray-500">
              <span>
                Total rabatt:{' '}
                <span className="text-gray-700 tabular-nums">
                  {totalDiscount.toLocaleString('nb-NO', MONEY_FMT)}
                </span>
              </span>
              <span className="text-sm font-semibold text-gray-900 tabular-nums">
                {grandTotal.toLocaleString('nb-NO', MONEY_FMT)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
