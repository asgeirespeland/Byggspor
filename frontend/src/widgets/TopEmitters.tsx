import type { DetailedReport } from '@/entities/report/types'
import { fmt } from '@/entities/report/utils'

interface TopEmittersProps {
  report: DetailedReport
  materialEmissions: number
  materialSequestration: number
}

export default function TopEmitters({
  report,
  materialEmissions,
  materialSequestration,
}: TopEmittersProps) {
  const gross = report.total_co2_kg - materialSequestration
  const { categories } = report

  type BarSegment = { color: string; pct: number }
  type BarEntry = {
    key: string
    label: string
    dot: string
    co2: number
    segments?: BarSegment[]
  }

  const absTotal =
    materialEmissions +
    Math.abs(materialSequestration) +
    Math.abs(categories.transport.total_co2_kg) +
    Math.abs(categories.waste.total_co2_kg) +
    Math.abs(categories.energy.total_co2_kg)

  const pct = (v: number) => (absTotal > 0 ? (Math.abs(v) / absTotal) * 100 : 0)

  const bars: BarEntry[] = [
    {
      key: 'materials',
      label: 'Materialer',
      dot: 'bg-materials',
      co2: categories.materials.total_co2_kg,
      segments: [
        { color: 'bg-materials', pct: pct(materialEmissions) },
        ...(materialSequestration < 0
          ? [{ color: 'bg-carbon', pct: pct(materialSequestration) }]
          : []),
      ],
    },
    {
      key: 'transport',
      label: 'Transport',
      dot: 'bg-transport',
      co2: categories.transport.total_co2_kg,
    },
    {
      key: 'waste',
      label: 'Avfall',
      dot: 'bg-waste',
      co2: categories.waste.total_co2_kg,
    },
    {
      key: 'energy',
      label: 'Energi',
      dot: 'bg-energy',
      co2: categories.energy.total_co2_kg,
    },
  ]

  const sorted = [...bars].sort((a, b) => Math.abs(b.co2) - Math.abs(a.co2))

  return (
    <div className="space-y-4">
      {/* Gross vs sequestration */}
      {materialSequestration < 0 && (
        <div className="flex gap-4 text-xs">
          <div>
            <p className="text-gray-400">Brutto utslipp</p>
            <p className="font-semibold text-gray-800 tabular-nums">
              {fmt(gross)} kg
            </p>
          </div>
          <div>
            <p className="text-gray-400">Karbonbinding</p>
            <p className="font-semibold text-carbon-strong tabular-nums">
              −{fmt(Math.abs(materialSequestration))} kg
            </p>
          </div>
          <div>
            <p className="text-gray-400">Netto</p>
            <p className="font-semibold text-gray-800 tabular-nums">
              {fmt(report.total_co2_kg)} kg
            </p>
          </div>
        </div>
      )}

      {/* Per-category bars */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Bidrag til beregning
        </p>
        <div className="space-y-2.5">
          {sorted.map(({ key, label, dot, co2, segments }) => {
            const totalPct = segments
              ? segments.reduce((s, seg) => s + seg.pct, 0)
              : pct(co2)
            const isNegative = co2 < 0
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${dot}`} />
                  <span className="text-gray-600">{label}</span>
                  {isNegative && (
                    <span className="text-[10px] text-carbon-strong">
                      karbonbinding
                    </span>
                  )}
                  <span
                    className={`ml-auto font-medium tabular-nums ${isNegative ? 'text-carbon-strong' : 'text-gray-800'}`}
                  >
                    {isNegative ? `−${fmt(Math.abs(co2))}` : fmt(co2)} kg
                  </span>
                  <span className="text-gray-400 w-10 text-right tabular-nums">
                    {Math.round(totalPct)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="flex h-full"
                    style={{ width: `${totalPct}%` }}
                  >
                    {segments ? (
                      segments.map((seg, i) => (
                        <div
                          key={i}
                          className={`h-full ${seg.color}`}
                          style={{ width: `${(seg.pct / totalPct) * 100}%` }}
                        />
                      ))
                    ) : (
                      <div
                        className={`h-full ${isNegative ? 'bg-carbon' : dot}`}
                        style={{ width: '100%' }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
