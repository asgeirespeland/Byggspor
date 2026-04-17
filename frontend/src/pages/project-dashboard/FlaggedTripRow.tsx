import { Truck } from 'lucide-react'
import type { ProjectTripItem } from '@/entities/transport/api/projectTransports'

type FlaggedTrip = ProjectTripItem & { kind: 'transport' }

interface Props {
  trip: FlaggedTrip
  onNavigate: () => void
}

export default function FlaggedTripRow({ trip, onNavigate }: Props) {
  return (
    <div className="flex items-start gap-2">
      <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-gray-700">
          {trip.start_address ?? '?'} &rarr; {trip.end_address ?? '?'}
        </p>
        <p className="text-[11px] text-amber-600">Mangler utslippsdata</p>
      </div>
      <button
        onClick={onNavigate}
        className="shrink-0 text-[11px] font-medium text-amber-600 hover:text-amber-800"
      >
        Se tur
      </button>
    </div>
  )
}
