import type { LineItem } from '../types/invoice'
import { getGwpA1A3 } from '../utils'

export default function InvoiceTotalCo2({ items }: { items: LineItem[] }) {
  let total = 0
  let count = 0
  for (const item of items) {
    const gwp = getGwpA1A3(item)
    if (gwp != null) {
      total += gwp * (item.quantity ?? 1)
      count++
    }
  }
  if (count === 0) return null
  return (
    <span className="rounded bg-green-100 px-3 py-1 text-green-800">
      CO₂: {total.toFixed(2)} kg ({count}/{items.length} linjer)
    </span>
  )
}
