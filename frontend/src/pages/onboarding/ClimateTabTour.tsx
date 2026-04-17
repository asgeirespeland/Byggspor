/**
 * Five-step modal walkthrough of the CO₂ categories, mounted on the project dashboard climate tab.
 * Caller owns the step state via useClimateTabTour; this component renders one step at a time.
 */
import {
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronLeft,
  Leaf,
  Package,
  Truck,
  Trash2,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TOUR_STEPS, TOUR_STEP_COUNT, type TourIcon } from './tourSteps'

const ICON_MAP: Record<TourIcon, LucideIcon> = {
  leaf: Leaf,
  package: Package,
  truck: Truck,
  trash2: Trash2,
  zap: Zap,
}

interface Props {
  open: boolean
  step: number
  onNext: () => void
  onPrev: () => void
  onClose: () => void
}

export default function ClimateTabTour({
  open,
  step,
  onNext,
  onPrev,
  onClose,
}: Props) {
  const current = TOUR_STEPS[step]
  const Icon = ICON_MAP[current.icon]
  const isFirst = step === 0
  const isLast = step === TOUR_STEP_COUNT - 1

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md w-full flex flex-col max-h-[85vh]">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-1">
            <span>Omvisning</span>
            <span>·</span>
            <span>
              Steg {step + 1} av {TOUR_STEP_COUNT}
            </span>
          </div>
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${current.iconBg} mb-1`}
          >
            <Icon className={`h-7 w-7 ${current.iconColor}`} />
          </div>
          <DialogTitle className="text-center text-base font-semibold text-gray-900 leading-snug">
            {current.title}
          </DialogTitle>
        </DialogHeader>

        {/* Body — fixed height so dialog doesn't shift between steps */}
        <div className="h-[30vh] max-h-72 overflow-y-auto space-y-3 text-sm">
          <p className="text-gray-600 leading-relaxed">{current.what}</p>

          <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              Hva legger du inn?
            </p>
            <p className="text-gray-700 leading-relaxed">{current.how}</p>
          </div>

          {current.note && (
            <div
              className={`flex gap-2.5 rounded-lg px-3 py-2.5 ${
                current.note.type === 'warning'
                  ? 'bg-warning-soft border border-warning/20'
                  : 'bg-info-soft border border-info/20'
              }`}
            >
              {current.note.type === 'warning' ? (
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
              ) : (
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-info" />
              )}
              <p
                className={`text-xs leading-relaxed ${
                  current.note.type === 'warning'
                    ? 'text-warning-strong'
                    : 'text-info-strong'
                }`}
              >
                {current.note.text}
              </p>
            </div>
          )}
        </div>

        {/* Step dots */}
        <div className="shrink-0 flex justify-center gap-1.5 pt-1">
          {Array.from({ length: TOUR_STEP_COUNT }).map((_, i) => (
            <span
              key={i}
              className={`block h-1.5 rounded-full transition-all duration-200 ${
                i === step ? 'w-4 bg-gray-700' : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Footer navigation */}
        <div className="shrink-0 flex items-center justify-between gap-2 -mx-4 -mb-4 px-4 py-3 border-t bg-muted/50 rounded-b-xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            Hopp over
          </Button>

          <div className="flex gap-2">
            {!isFirst && (
              <Button variant="outline" size="sm" onClick={onPrev}>
                <ChevronLeft className="h-3.5 w-3.5" />
                Forrige
              </Button>
            )}
            <Button size="sm" onClick={onNext}>
              {isLast ? (
                'Ferdig'
              ) : (
                <>
                  Neste
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
