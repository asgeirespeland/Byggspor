export default function EpdBadge({
  enriched,
  hasEpd,
}: {
  enriched: boolean
  hasEpd: boolean
}) {
  if (!enriched) {
    return (
      <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-600">
        Ikke søkbar
      </span>
    )
  }

  if (hasEpd) {
    return (
      <span className="inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        EPD
      </span>
    )
  }

  return (
    <span className="inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
      Ingen EPD
    </span>
  )
}
