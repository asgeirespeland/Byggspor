/**
 * Two read-only reference tables rendered inside the MethodologySection fullscreen modal:
 * NS 9431 fraction factors and manual override factors.
 */
import type { ReportSettings } from '@/entities/report'

const TH =
  'px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'

export function Ns9431Table({
  factors,
}: {
  factors: ReportSettings['waste']['ns9431_factors']
}) {
  const sorted = [...factors].sort((a, b) => b.factor - a.factor)
  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-border bg-muted/50">
        <tr>
          <th className={TH}>Kode</th>
          <th className={TH}>Avfallstype</th>
          <th className={`${TH} text-right`}>Faktor (kg CO₂e/t)</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {sorted.map(({ code, label, factor }) => (
          <tr key={code}>
            <td className="px-4 py-2 text-muted-foreground tabular-nums">
              {code}
            </td>
            <td className="px-4 py-2 text-muted-foreground">{label}</td>
            <td className="px-4 py-2 text-right font-medium text-foreground tabular-nums">
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
      <thead className="border-b border-border bg-muted/50">
        <tr>
          <th className={TH}>Avfallstype</th>
          <th className={`${TH} text-right`}>Faktor (kg CO₂e/t)</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {entries.map(([key, value]) => (
          <tr key={key} className="capitalize">
            <td className="px-4 py-2 text-muted-foreground">{key}</td>
            <td className="px-4 py-2 text-right font-medium text-foreground tabular-nums">
              {value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
