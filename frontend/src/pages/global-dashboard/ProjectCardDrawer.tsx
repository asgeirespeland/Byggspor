import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { STATUS_CONFIG } from '@/entities/project/constants'
import type { Project } from '@/entities/project/hooks/useProjects'
import ResponsiveConfidenceGauge from '@/widgets/ResponsiveConfidenceGauge'

interface ProjectCardDrawerProps {
  project: Project
  confidenceScore: number | null
  createdDate: string
}

export default function ProjectCardDrawer({
  project,
  confidenceScore,
  createdDate,
}: ProjectCardDrawerProps) {
  const navigate = useNavigate()
  const status = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.active

  return (
    <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4">
      <div className="flex flex-wrap items-center gap-6">
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

        {confidenceScore != null ? (
          <ResponsiveConfidenceGauge score={Math.round(confidenceScore)} />
        ) : (
          <p className="text-xs text-gray-400">Ingen data</p>
        )}

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
  )
}
