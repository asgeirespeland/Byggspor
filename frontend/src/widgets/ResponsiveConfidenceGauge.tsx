import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import ConfidenceGauge from './ConfidenceGauge'

interface ResponsiveConfidenceGaugeProps {
  score: number
}

export default function ResponsiveConfidenceGauge({
  score,
}: ResponsiveConfidenceGaugeProps) {
  return (
    <>
      <div className="hidden min-[704px]:flex flex-col items-center">
        <p className="mb-1 text-xs font-medium text-gray-500">CO₂ Konfidens</p>
        <ConfidenceGauge score={score} />
      </div>
      <div className="min-[704px]:hidden">
        <Tooltip>
          <TooltipTrigger>
            <ConfidenceGauge score={score} size="compact" />
          </TooltipTrigger>
          <TooltipContent>CO₂ Konfidens</TooltipContent>
        </Tooltip>
      </div>
    </>
  )
}
