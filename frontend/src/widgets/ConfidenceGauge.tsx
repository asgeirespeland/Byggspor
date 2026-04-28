/**
 * Half-circle SVG confidence gauge with `size?: 'full' | 'compact'`.
 * Tier thresholds, colours, and labels come from entities/report/confidence.
 */
import {
  CONFIDENCE_TIER_COLOR,
  CONFIDENCE_TIER_LABEL,
  confidenceTier,
} from '@/entities/report'

const FULL_GAUGE = {
  radius: 54,
  cx: 70,
  cy: 72,
  width: 140,
  height: 84,
  strokeWidth: 10,
}
const COMPACT_GAUGE = {
  radius: 30,
  cx: 36,
  cy: 36,
  width: 72,
  height: 44,
  strokeWidth: 6,
}

type Props = {
  score: number
  size?: 'full' | 'compact'
}

function scoreColor(score: number) {
  return CONFIDENCE_TIER_COLOR[confidenceTier(score)]
}

function scoreLabel(score: number) {
  return CONFIDENCE_TIER_LABEL[confidenceTier(score)]
}

function FullGauge({ score }: { score: number }) {
  const { radius, cx, cy } = FULL_GAUGE
  const circumference = Math.PI * radius
  const progress = (score / 100) * circumference
  const color = scoreColor(score)
  const label = scoreLabel(score)

  return (
    <div className="flex flex-col items-center">
      <svg
        width={FULL_GAUGE.width}
        height={FULL_GAUGE.height}
        viewBox={`0 0 ${FULL_GAUGE.width} ${FULL_GAUGE.height}`}
      >
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="var(--gauge-track)"
          strokeWidth={FULL_GAUGE.strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={FULL_GAUGE.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontSize="24"
          fontWeight="700"
          fill="var(--gauge-text)"
        >
          {score}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fontSize="11"
          fill="var(--gauge-subtext)"
        >
          / 100
        </text>
      </svg>
      <span
        className="mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full"
        style={{ color, backgroundColor: `${color}18` }}
      >
        {label} konfidens
      </span>
    </div>
  )
}

function CompactGauge({ score }: { score: number }) {
  const { radius, cx, cy } = COMPACT_GAUGE
  const circumference = Math.PI * radius
  const progress = (score / 100) * circumference
  const color = scoreColor(score)

  return (
    <div className="flex items-center gap-2">
      <svg
        width={COMPACT_GAUGE.width}
        height={COMPACT_GAUGE.height}
        viewBox={`0 0 ${COMPACT_GAUGE.width} ${COMPACT_GAUGE.height}`}
      >
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="var(--gauge-track)"
          strokeWidth={COMPACT_GAUGE.strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={COMPACT_GAUGE.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fill="var(--gauge-text)"
        >
          {score}
        </text>
      </svg>
      <span className="text-xs text-muted-foreground">/ 100</span>
    </div>
  )
}

export default function ConfidenceGauge({ score, size = 'full' }: Props) {
  return size === 'compact' ? (
    <CompactGauge score={score} />
  ) : (
    <FullGauge score={score} />
  )
}
