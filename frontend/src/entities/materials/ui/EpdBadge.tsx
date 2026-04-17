import { Badge } from '@/components/ui/badge'

export default function EpdBadge({
  enriched,
  hasEpd,
}: {
  enriched: boolean
  hasEpd: boolean
}) {
  if (!enriched) {
    return (
      <Badge variant="warning" className="rounded">
        Ikke søkbar
      </Badge>
    )
  }

  if (hasEpd) {
    return (
      <Badge variant="success" className="rounded">
        EPD
      </Badge>
    )
  }

  return (
    <Badge variant="danger" className="rounded">
      Ingen EPD
    </Badge>
  )
}
