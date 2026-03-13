import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  ChevronUp,
  Building2,
  Hash,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Project } from '../../project/hooks/useProjects'

type Props = {
  project: Project
}

const STATUS_CONFIG = {
  active: {
    label: 'Aktiv',
    className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  completed: {
    label: 'Fullført',
    className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    dot: 'bg-blue-500',
  },
  archived: {
    label: 'Arkivert',
    className: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
    dot: 'bg-gray-400',
  },
}

// Confidence score gauge — SVG arc-based semi-circle
function ConfidenceGauge({ score }: { score: number }) {
  const radius = 54
  const cx = 70
  const cy = 70
  const circumference = Math.PI * radius // half circle
  const progress = (score / 100) * circumference

  // Color based on score
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'

  const label = score >= 75 ? 'Høy' : score >= 50 ? 'Middels' : 'Lav'

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="140" height="80" viewBox="0 0 140 80">
        {/* Track */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Progress */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        {/* Score text */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill="#111827"
        >
          {score}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fontSize="11"
          fill="#6b7280"
        >
          / 100
        </text>
      </svg>
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ color, backgroundColor: `${color}18` }}
      >
        {label} konfidens
      </span>
    </div>
  )
}

export default function ProjectCard({ project }: Props) {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()

  const status = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.active

  // Placeholder confidence score — replace with real data when available
  const confidenceScore = 72

  const createdDate = new Date(project.created_at).toLocaleDateString('nb-NO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      {/* Main card row */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
          <Building2 className="h-4 w-4 text-gray-500" />
        </div>

        {/* Name + meta */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">
            {project.name}
          </p>
          <div className="mt-0.5 flex items-center gap-3">
            {project.project_number && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Hash className="h-3 w-3" />
                {project.project_number}
              </span>
            )}
            <span className="text-xs text-gray-400">{createdDate}</span>
          </div>
        </div>

        {/* Status badge */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>

        {/* Chevron indicator */}
        <div className="text-gray-400">
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </div>

      {/* Expandable drawer */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? 'max-h-64' : 'max-h-0'
        }`}
      >
        <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Left: metadata */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-20 text-xs text-gray-400">Kunde</span>
                <span className="text-gray-700">
                  {project.customer_id ? `Kunde #${project.customer_id}` : '—'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-20 text-xs text-gray-400">Status</span>
                <span className="text-gray-700">{status.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-20 text-xs text-gray-400">Opprettet</span>
                <span className="text-gray-700">{createdDate}</span>
              </div>
            </div>

            {/* Center: confidence gauge */}
            <div className="flex flex-col items-center">
              <p className="mb-1 text-xs font-medium text-gray-500">
                CO₂ Konfidens
              </p>
              <ConfidenceGauge score={confidenceScore} />
            </div>

            {/* Right: open project button */}
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/projects/${project.id}`)
              }}
            >
              Åpne prosjekt
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
