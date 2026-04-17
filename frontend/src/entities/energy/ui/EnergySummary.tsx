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
      <div className="rounded-lg border border-energy/20 bg-energy-soft px-4 py-3">
        <p className="text-xs font-medium text-energy-strong">Totalt forbruk</p>
        <p className="mt-0.5 text-lg font-semibold text-energy-strong">
          {totalKwh.toLocaleString('nb-NO', { maximumFractionDigits: 1 })} kWh
        </p>
      </div>
      <div className="rounded-lg border border-total/20 bg-total-soft px-4 py-3">
        <p className="text-xs font-medium text-total-strong">Totalt CO₂</p>
        <p className="mt-0.5 text-lg font-semibold text-total-strong">
          {totalCo2.toLocaleString('nb-NO', { maximumFractionDigits: 2 })} kg
        </p>
      </div>
    </div>
  )
}
