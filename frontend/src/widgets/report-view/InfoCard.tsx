/**
 * Two small presentational primitives used only by MethodologySection: InfoCard (titled bordered
 * panel) and InfoRow (label + value + optional detail). Kept together because they compose.
 */
export function InfoRow({
  label,
  value,
  detail,
}: {
  label: string
  value: React.ReactNode
  detail?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="text-sm text-muted-foreground shrink-0">{label}</div>
      <div className="text-sm text-foreground text-right">
        <div className="font-medium">{value}</div>
        {detail && (
          <div className="text-xs text-muted-foreground mt-0.5">{detail}</div>
        )}
      </div>
    </div>
  )
}

export function InfoCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      </div>
      <div className="px-4 divide-y divide-border">{children}</div>
    </div>
  )
}
