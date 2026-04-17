import { Badge } from '@/components/ui/badge'

interface Co2TotalBadgeProps {
  total: number
  count: number
  label: string
}

export default function Co2TotalBadge({
  total,
  count,
  label,
}: Co2TotalBadgeProps) {
  if (count === 0) return null
  return (
    <Badge variant="total" className="h-auto rounded-full px-3 py-1">
      CO₂: {total.toFixed(2)} kg ({count} {label})
    </Badge>
  )
}
