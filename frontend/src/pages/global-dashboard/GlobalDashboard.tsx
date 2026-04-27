/**
 * Organization-level landing page: heading, stat-card placeholders, searchable list of projects,
 * and the 'new project' dialog. Route: '/'.
 */
import { useState } from 'react'
import { CreateProjectDialog } from '@/features/create-project'
import ProjectCard from './ProjectCard'
import ItemListPanel from '@/shared/components/ItemListPanel'
import { useProjects } from '@/entities/project'
import { useAppContext } from '@/shared/hooks/useAppContext'

export default function GlobalDashboard() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data: projects = [], isLoading, error } = useProjects()
  const { organization } = useAppContext()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {organization?.name ?? '\u00A0'}
      </h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: 'Prosjekter',
            value: !isLoading ? projects.length : '—',
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
        loading={isLoading}
        error={error?.message}
      />

      <CreateProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
