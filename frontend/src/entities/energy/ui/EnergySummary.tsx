interface EnergySummaryProps {
  totalKwh: number
  totalCo2: number
}

export default function EnergySummary({
  totalKwh,
  totalCo2,
}: EnergySummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
        <p className="text-xs font-medium text-yellow-700">Totalt forbruk</p>
        <p className="mt-0.5 text-lg font-semibold text-yellow-900">
          {totalKwh.toLocaleString('nb-NO', { maximumFractionDigits: 1 })} kWh
        </p>
      </div>
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
        <p className="text-xs font-medium text-emerald-700">Totalt CO₂</p>
        <p className="mt-0.5 text-lg font-semibold text-emerald-900">
          {totalCo2.toLocaleString('nb-NO', { maximumFractionDigits: 2 })} kg
        </p>
      </div>
    </div>
  )
}
