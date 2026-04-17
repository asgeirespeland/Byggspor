/**
 * Sidebar card that aggregates flagged materials + flagged trips (first 8) and exposes hide-session /
 * hide-forever via useDismiss. Pulls from two entity hooks simultaneously.
 */
import { AlertTriangle, X } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useProjectMaterials } from '@/entities/materials/hooks/useProjectMaterials'
import { useProjectTransports } from '@/entities/transport/hooks/useProjectTransports'
import { useDismiss } from '@/shared/hooks/useDismiss'
import type { ProjectMaterialItem } from '@/entities/materials/api'
import type { ProjectTripItem } from '@/entities/transport/api/projectTransports'
import FlaggedMaterialRow from './FlaggedMaterialRow'
import FlaggedTripRow from './FlaggedTripRow'

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
    <div className="rounded-xl border border-warning/20 bg-warning-soft/50 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-warning" />
        <p className="text-xs font-semibold uppercase tracking-wide text-warning-strong">
          Trenger oppmerksomhet ({flagged.length})
        </p>
        <TooltipProvider>
          <span className="ml-auto inline-flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger
                className="text-[10px] text-warning/70 hover:text-warning-strong cursor-pointer"
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
                className="text-warning/60 hover:text-warning cursor-pointer"
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
              <FlaggedTripRow
                key={`t-${entry.id}`}
                trip={entry}
                onNavigate={() => onNavigateToTab?.('transport')}
              />
            ),
          )}
        {flagged.length > 8 && (
          <p className="text-xs text-warning-strong">
            + {flagged.length - 8} flere poster
          </p>
        )}
      </div>
    </div>
  )
}
