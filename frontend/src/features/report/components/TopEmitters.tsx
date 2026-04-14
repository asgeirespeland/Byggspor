import type { DetailedReport } from '../types/report'
import { fmt } from '../utils'

const CATEGORY_CONFIG = [
  { key: 'materials' as const, label: 'Materialer', dot: 'bg-blue-500' },
  { key: 'transport' as const, label: 'Transport', dot: 'bg-orange-500' },
  { key: 'waste' as const, label: 'Avfall', dot: 'bg-red-500' },
  { key: 'energy' as const, label: 'Energi', dot: 'bg-yellow-500' },
]

export default function TopEmitters({ report }: { report: DetailedReport }) {
  const { categories } = report
  const absTotal = CATEGORY_CONFIG.reduce(
    (s, c) => s + Math.abs(categories[c.key].total_co2_kg),
    0,
  )

  const allItems = [
    ...categories.materials.items,
    ...categories.transport.items,
    ...categories.waste.items,
    ...categories.energy.items,
  ].map((i) => i.total_co2_kg ?? 0)

  const gross = allItems.filter((v) => v > 0).reduce((s, v) => s + v, 0)
  const sequestration = allItems.filter((v) => v < 0).reduce((s, v) => s + v, 0)

  const sorted = [...CATEGORY_CONFIG].sort(
    (a, b) =>
      Math.abs(categories[b.key].total_co2_kg) -
      Math.abs(categories[a.key].total_co2_kg),
  )

  return (
    <div className="space-y-4">
      {/* Gross vs sequestration */}
      {sequestration < 0 && (
        <div className="flex gap-4 text-xs">
          <div>
            <p className="text-gray-400">Brutto utslipp</p>
            <p className="font-semibold text-gray-800 tabular-nums">
              {fmt(gross)} kg
            </p>
          </div>
          <div>
            <p className="text-gray-400">Karbonbinding</p>
            <p className="font-semibold text-emerald-600 tabular-nums">
              −{fmt(Math.abs(sequestration))} kg
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
          Per kategori
        </p>
        <div className="space-y-2.5">
          {sorted.map(({ key, label, dot }) => {
            const co2 = categories[key].total_co2_kg
            const pct = absTotal > 0 ? (Math.abs(co2) / absTotal) * 100 : 0
            const isNegative = co2 < 0
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${dot}`} />
                  <span className="text-gray-600">{label}</span>
                  {isNegative && (
                    <span className="text-[10px] text-emerald-600">
                      karbonbinding
                    </span>
                  )}
                  <span
                    className={`ml-auto font-medium tabular-nums ${isNegative ? 'text-emerald-600' : 'text-gray-800'}`}
                  >
                    {isNegative ? `−${fmt(Math.abs(co2))}` : fmt(co2)} kg
                  </span>
                  <span className="text-gray-400 w-10 text-right tabular-nums">
                    {Math.round(pct)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isNegative ? 'bg-emerald-400' : dot}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
