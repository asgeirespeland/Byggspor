import { useState } from 'react'
import { ArrowRight, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { STATUS_CONFIG } from '@/entities/project'
import type { Project } from '@/entities/project'
import { useDeleteProject } from '@/features/edit-project/hooks/useDeleteProject'
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
  const [deleteOpen, setDeleteOpen] = useState(false)
  const deleteMutation = useDeleteProject(project.id)
  const status = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.active

  async function handleDelete() {
    await deleteMutation.mutateAsync()
    setDeleteOpen(false)
  }

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

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation()
              setDeleteOpen(true)
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Slett
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 cursor-pointer"
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

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slett prosjekt?</DialogTitle>
            <DialogDescription>
              Dette vil slette «{project.name}» og alle tilknyttede
              prosjektdata. Handlingen kan ikke angres.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Avbryt
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Sletter...' : 'Slett prosjekt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
