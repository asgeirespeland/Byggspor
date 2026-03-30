import Co2TotalBadge from '@/shared/components/Co2TotalBadge'
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
  return (
    <Co2TotalBadge
      total={total}
      count={count}
      label={`${count}/${items.length} linjer`}
    />
  )
}
