type Props = {
  label: string
  value: string | number
  unit: string
  icon: React.ReactNode
  accent: string
}

export default function KpiCard({ label, value, unit, icon, accent }: Props) {
  return (
    <div className="@container flex-1 min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent}`}
        >
          {icon}
        </div>
      </div>
      <p
        className="font-bold text-foreground"
        style={{ fontSize: 'clamp(1rem, 10cqw, 2.5rem)' }}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{unit}</p>
    </div>
  )
}
