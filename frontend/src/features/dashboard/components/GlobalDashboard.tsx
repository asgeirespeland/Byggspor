import { useState } from 'react'
import { Search, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import CreateProjectDialog from './CreateProjectDialog'
import ProjectCard from './ProjectCard'
import { useProjects } from '../../project/hooks/useProjects'

export default function GlobalDashboard() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [search, setSearch] = useState('')
  const projectsState = useProjects()

  const projects =
    projectsState.status === 'ready' ? projectsState.projects : []

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: 'Prosjekter',
            value: projectsState.status === 'ready' ? projects.length : '—',
          },
          { label: 'Transport', value: '—' },
          { label: 'Faktura', value: '—' },
          { label: 'CO₂ Estimat', value: '—' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Project list */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-700">Prosjekter</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Søk prosjekter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-40 sm:w-56 h-8 text-sm"
              />
            </div>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    size="sm"
                    onClick={() => setDialogOpen(true)}
                    className="gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden lg:inline">
                      Opprett nytt prosjekt
                    </span>
                  </Button>
                }
              />
              <TooltipContent className="lg:hidden">
                Opprett nytt prosjekt
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Loading */}
        {projectsState.status === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Laster prosjekter...</span>
          </div>
        )}

        {/* Error */}
        {projectsState.status === 'error' && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-red-500">{projectsState.message}</p>
          </div>
        )}

        {/* Empty state */}
        {projectsState.status === 'ready' && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            {search ? (
              <>
                <p className="text-sm text-gray-400">
                  Ingen prosjekter matcher "{search}"
                </p>
                <button
                  type="button"
                  className="mt-2 text-xs text-gray-400 underline"
                  onClick={() => setSearch('')}
                >
                  Nullstill søk
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-400">Ingen prosjekter enda</p>
                <p className="mt-1 text-xs text-gray-300">
                  Prosjekter vil vises her når de er lagt til
                </p>
              </>
            )}
          </div>
        )}

        {/* Project cards */}
        {projectsState.status === 'ready' && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      <CreateProjectDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
        }}
      />
    </div>
  )
}
