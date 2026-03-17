import type { Trip } from '../types/transport'

export default function Co2Badge({
  trip,
  onFix,
}: {
  trip: Trip
  onFix: () => void
}) {
  if (!trip.flagged) {
    return (
      <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        OK
      </span>
    )
  }
  return (
    <button
      onClick={onFix}
      className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-200"
    >
      Mangler data
    </button>
  )
}
