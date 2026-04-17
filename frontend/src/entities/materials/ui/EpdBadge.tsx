export default function EpdBadge({
  enriched,
  hasEpd,
}: {
  enriched: boolean
  hasEpd: boolean
}) {
  if (!enriched) {
    return (
      <span className="inline-block rounded bg-warning-soft px-2 py-0.5 text-xs text-warning-strong">
        Ikke søkbar
      </span>
    )
  }

  if (hasEpd) {
    return (
      <span className="inline-block rounded bg-success-soft px-2 py-0.5 text-xs font-medium text-success-strong">
        EPD
      </span>
    )
  }

  return (
    <span className="inline-block rounded bg-danger-soft px-2 py-0.5 text-xs font-medium text-danger-strong">
      Ingen EPD
    </span>
  )
}
