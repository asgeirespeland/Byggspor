import { Truck } from 'lucide-react'
import type { ProjectTripItem } from '@/entities/transport'

type FlaggedTrip = ProjectTripItem & { kind: 'transport' }

interface Props {
  trip: FlaggedTrip
  onNavigate: () => void
}

export default function FlaggedTripRow({ trip, onNavigate }: Props) {
  return (
    <div className="flex items-start gap-2">
      <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-muted-foreground">
          {trip.start_address ?? '?'} &rarr; {trip.end_address ?? '?'}
        </p>
        <p className="text-[11px] text-warning-strong">Mangler utslippsdata</p>
      </div>
      <button
        onClick={onNavigate}
        className="shrink-0 text-[11px] font-medium text-warning-strong hover:text-warning-strong/80"
      >
        Se tur
      </button>
    </div>
  )
}
