type Props = {
  score: number
  size?: 'full' | 'compact'
}

function scoreColor(score: number) {
  return score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
}

function scoreLabel(score: number) {
  return score >= 75 ? 'Høy' : score >= 50 ? 'Middels' : 'Lav'
}

function FullGauge({ score }: { score: number }) {
  const radius = 54
  const cx = 70
  const cy = 72
  const circumference = Math.PI * radius
  const progress = (score / 100) * circumference
  const color = scoreColor(score)
  const label = scoreLabel(score)

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="84" viewBox="0 0 140 84">
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="10"
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
          fill="#111827"
        >
          {score}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fontSize="11"
          fill="#9ca3af"
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
  const radius = 30
  const cx = 36
  const cy = 36
  const circumference = Math.PI * radius
  const progress = (score / 100) * circumference
  const color = scoreColor(score)

  return (
    <div className="flex items-center gap-2">
      <svg width="72" height="44" viewBox="0 0 72 44">
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="6"
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
          fill="#111827"
        >
          {score}
        </text>
      </svg>
      <span className="text-xs text-gray-400">/ 100</span>
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
