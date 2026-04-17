import type { ReportSettings } from '@/entities/report/types'

const TH =
  'px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400'

export function Ns9431Table({
  factors,
}: {
  factors: ReportSettings['waste']['ns9431_factors']
}) {
  const sorted = [...factors].sort((a, b) => b.factor - a.factor)
  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-gray-200 bg-gray-50">
        <tr>
          <th className={TH}>Kode</th>
          <th className={TH}>Avfallstype</th>
          <th className={`${TH} text-right`}>Faktor (kg CO₂e/t)</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {sorted.map(({ code, label, factor }) => (
          <tr key={code}>
            <td className="px-4 py-2 text-gray-400 tabular-nums">{code}</td>
            <td className="px-4 py-2 text-gray-700">{label}</td>
            <td className="px-4 py-2 text-right font-medium text-gray-800 tabular-nums">
              {factor}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function ManualFactorsTable({
  factors,
}: {
  factors: Record<string, number>
}) {
  const entries = Object.entries(factors).sort(([, a], [, b]) => b - a)
  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-gray-200 bg-gray-50">
        <tr>
          <th className={TH}>Avfallstype</th>
          <th className={`${TH} text-right`}>Faktor (kg CO₂e/t)</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {entries.map(([key, value]) => (
          <tr key={key} className="capitalize">
            <td className="px-4 py-2 text-gray-700">{key}</td>
            <td className="px-4 py-2 text-right font-medium text-gray-800 tabular-nums">
              {value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
