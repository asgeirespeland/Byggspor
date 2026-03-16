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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { STATUS_CONFIG } from '@/features/project/constants'
import ConfidenceGauge from './ConfidenceGauge'
import type { Project } from '../../project/hooks/useProjects'

export default function ProjectCard({ project }: { project: Project }) {
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
          expanded ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4">
          <div className="flex flex-wrap items-center gap-6">
            {/* Left: metadata */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-20 text-xs text-gray-400">Kunde</span>
                <span className="text-gray-700">
                  {project.customer_name ?? '—'}
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

            {/* Confidence gauge: full on wider screens, compact with tooltip on smaller */}
            <div className="hidden min-[704px]:flex flex-col items-center">
              <p className="mb-1 text-xs font-medium text-gray-500">
                CO₂ Konfidens
              </p>
              <ConfidenceGauge score={confidenceScore} />
            </div>
            <div className="min-[704px]:hidden">
              <Tooltip>
                <TooltipTrigger>
                  <ConfidenceGauge score={confidenceScore} size="compact" />
                </TooltipTrigger>
                <TooltipContent>CO₂ Konfidens</TooltipContent>
              </Tooltip>
            </div>

            {/* Right: open project button */}
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 shrink-0 ml-auto cursor-pointer"
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
