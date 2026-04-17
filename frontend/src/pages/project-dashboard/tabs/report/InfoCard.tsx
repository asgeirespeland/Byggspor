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
      <div className="text-sm text-gray-500 shrink-0">{label}</div>
      <div className="text-sm text-gray-800 text-right">
        <div className="font-medium">{value}</div>
        {detail && <div className="text-xs text-gray-400 mt-0.5">{detail}</div>}
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
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      </div>
      <div className="px-4 divide-y divide-gray-100">{children}</div>
    </div>
  )
}
