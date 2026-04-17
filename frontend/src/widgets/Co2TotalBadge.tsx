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
    <span className="rounded-full bg-total-soft px-3 py-1 text-xs font-medium text-total-strong">
      CO₂: {total.toFixed(2)} kg ({count} {label})
    </span>
  )
}
