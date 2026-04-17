/**
 * Report-view formatting helpers.
 * Exports: fmt (nb-NO number), co2Label (JSX, handles negative carbon-binding),
 * sourceLabel (maps source_type strings to Norwegian labels), and
 * confidenceBadge (colored JSX pill). Shared across report tabs/sections.
 */
import { CONFIDENCE_TIER_BADGE_CLASS, confidenceTier } from './confidence'

const SOURCE_LABELS: Record<string, string> = {
  ehf_invoice: 'EHF-faktura',
  manual: 'Manuell',
  csv_import: 'CSV-import',
  abax_xml: 'Abax XML',
  waste_report: 'Avfallsrapport',
  file: 'Fil',
}

export function fmt(value: number | null | undefined, decimals = 1): string {
  if (value == null || value === 0) return '—'
  return value.toLocaleString('nb-NO', { maximumFractionDigits: decimals })
}

export function co2Label(value: number | null | undefined) {
  if (value == null || value === 0)
    return <span className="text-gray-400">—</span>
  if (value < 0) {
    return (
      <span className="text-emerald-600 font-medium">
        {fmt(Math.abs(value))} kg{' '}
        <span className="text-xs font-normal">(karbonbinding)</span>
      </span>
    )
  }
  return <span className="font-medium">{fmt(value)} kg</span>
}

export function sourceLabel(type: string | null): string {
  return (type && SOURCE_LABELS[type]) ?? type ?? '—'
}

export function confidenceBadge(score: number | null) {
  if (score == null) return <span className="text-gray-300">—</span>
  const color = CONFIDENCE_TIER_BADGE_CLASS[confidenceTier(score)]
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
    >
      {score}%
    </span>
  )
}
