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
import { useFlaggedEntries } from '@/entities/report'
import { useDismiss } from '@/shared/hooks/useDismiss'
import FlaggedMaterialRow from './FlaggedMaterialRow'
import FlaggedTripRow from './FlaggedTripRow'

interface Props {
  projectId: number
  onNavigateToTab?: (tab: 'materials' | 'transport') => void
}

const STORAGE_KEY_PREFIX = 'flagged-items-dismissed-'

export default function FlaggedItems({ projectId, onNavigateToTab }: Props) {
  const { isDismissed, dismissSession, dismissForever } = useDismiss(
    `${STORAGE_KEY_PREFIX}${projectId}`,
  )
  const flagged = useFlaggedEntries(projectId)

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
