type Props = {
  label: string
  value: string | number
  unit: string
  icon: React.ReactNode
  accent: string
}

export default function KpiCard({ label, value, unit, icon, accent }: Props) {
  return (
    <div className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent}`}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-0.5 text-xs text-gray-400">{unit}</p>
    </div>
  )
}
