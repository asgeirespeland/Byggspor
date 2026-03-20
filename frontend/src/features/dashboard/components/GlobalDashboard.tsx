import { useState } from 'react'
import CreateProjectDialog from './CreateProjectDialog'
import ProjectCard from './ProjectCard'
import ItemListPanel from '@/shared/components/ItemListPanel'
import { useProjects } from '../../project/hooks/useProjects'

export default function GlobalDashboard() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const projectsState = useProjects()

  const projects =
    projectsState.status === 'ready' ? projectsState.projects : []

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
      <ItemListPanel
        title="Prosjekter"
        items={projects}
        keyFn={(p) => p.id}
        filterFn={(p, q) => p.name.toLowerCase().includes(q)}
        renderItem={(p) => <ProjectCard project={p} />}
        searchPlaceholder="Søk prosjekter..."
        addLabel="Opprett nytt prosjekt"
        emptyLabel="Ingen prosjekter enda"
        emptyHint="Prosjekter vil vises her når de er lagt til"
        onAdd={() => setDialogOpen(true)}
        loading={projectsState.status === 'loading'}
        error={
          projectsState.status === 'error' ? projectsState.message : undefined
        }
      />

      <CreateProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
