import { AlertTriangle, Truck, X } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useProjectMaterials } from '@/features/invoice/hooks/useProjectMaterials'
import { useProjectTransports } from '@/features/transport/hooks/useProjectTransports'
import { useDismiss } from '@/shared/hooks/useDismiss'
import type { ProjectMaterialItem } from '@/features/invoice/api/invoice'
import type { ProjectTripItem } from '@/features/transport/api/projectTransports'
import FlaggedMaterialRow from './FlaggedMaterialRow'

type FlaggedMaterial = ProjectMaterialItem & { kind: 'material' }
type FlaggedTrip = ProjectTripItem & { kind: 'transport' }
type FlaggedEntry = FlaggedMaterial | FlaggedTrip

interface Props {
  projectId: number
  onNavigateToTab?: (tab: 'materials' | 'transport') => void
}

const STORAGE_KEY_PREFIX = 'flagged-items-dismissed-'

export default function FlaggedItems({ projectId, onNavigateToTab }: Props) {
  const { isDismissed, dismissSession, dismissForever } = useDismiss(
    `${STORAGE_KEY_PREFIX}${projectId}`,
  )
  const { data: invoiceGroups } = useProjectMaterials(projectId)
  const { data: reportGroups } = useProjectTransports(projectId)

  const flaggedMaterials: FlaggedMaterial[] =
    invoiceGroups?.flatMap((g) =>
      g.items
        .filter((item) => item.flagged)
        .map((item) => ({ ...item, kind: 'material' as const })),
    ) ?? []

  const flaggedTrips: FlaggedTrip[] =
    reportGroups?.flatMap((g) =>
      g.trips
        .filter((t) => t.flagged)
        .map((t) => ({ ...t, kind: 'transport' as const })),
    ) ?? []

  const flagged: FlaggedEntry[] = [...flaggedMaterials, ...flaggedTrips]

  if (flagged.length === 0 || isDismissed) return null

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
          Trenger oppmerksomhet ({flagged.length})
        </p>
        <TooltipProvider>
          <span className="ml-auto inline-flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger
                className="text-[10px] text-amber-400 hover:text-amber-600 cursor-pointer"
                onClick={dismissSession}
              >
                Skjul
              </TooltipTrigger>
              <TooltipContent>
                <p>Skjul for n&aring;</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                className="text-amber-300 hover:text-amber-500 cursor-pointer"
                onClick={dismissForever}
              >
                <X className="h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Ikke vis igjen</p>
              </TooltipContent>
            </Tooltip>
          </span>
        </TooltipProvider>
      </div>

      <div className="space-y-2">
        {flagged
          .slice(0, 8)
          .map((entry) =>
            entry.kind === 'material' ? (
              <FlaggedMaterialRow
                key={`m-${entry.id}`}
                item={entry}
                projectId={projectId}
              />
            ) : (
              <TripRow
                key={`t-${entry.id}`}
                trip={entry}
                onNavigate={() => onNavigateToTab?.('transport')}
              />
            ),
          )}
        {flagged.length > 8 && (
          <p className="text-xs text-amber-600">
            + {flagged.length - 8} flere poster
          </p>
        )}
      </div>
    </div>
  )
}

function TripRow({
  trip,
  onNavigate,
}: {
  trip: FlaggedTrip
  onNavigate: () => void
}) {
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
