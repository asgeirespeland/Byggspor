import type { LineItem } from '../types/invoice'
import { getGwpA1A3 } from '../utils'

export default function Co2Value({ item }: { item: LineItem }) {
  const gwp = getGwpA1A3(item)
  if (gwp == null) return <span className="text-gray-400">—</span>

  const qty = item.quantity ?? 1
  const total = gwp * qty
  return (
    <span title={`${gwp.toFixed(4)} kg CO₂e/enhet × ${qty}`}>
      {total.toFixed(2)}
    </span>
  )
}
