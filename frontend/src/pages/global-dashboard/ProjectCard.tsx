import { useState } from 'react'
import { ChevronDown, ChevronUp, Building2, Hash } from 'lucide-react'
import { STATUS_CONFIG } from '@/entities/project/lib/constants'
import { useCo2Summary } from '@/entities/report/hooks/useCo2Summary'
import ProjectCardDrawer from './ProjectCardDrawer'
import type { Project } from '@/entities/project/hooks/useProjects'

export default function ProjectCard({ project }: { project: Project }) {
  const [expanded, setExpanded] = useState(false)

  const status = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.active
  const { data: co2 } = useCo2Summary(project.id)
  const confidenceScore = co2?.overall_confidence ?? null

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
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
          <Building2 className="h-4 w-4 text-gray-500" />
        </div>

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

        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>

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
        <ProjectCardDrawer
          project={project}
          confidenceScore={confidenceScore}
          createdDate={createdDate}
        />
      </div>
    </div>
  )
}
