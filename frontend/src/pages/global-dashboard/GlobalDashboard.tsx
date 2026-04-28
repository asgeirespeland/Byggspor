/**
 * Organization-level landing page: heading, stat-card placeholders, searchable list of projects,
 * and the 'new project' dialog. Route: '/'.
 */
import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { CreateProjectDialog } from '@/features/create-project'
import ProjectCard from './ProjectCard'
import ItemListPanel from '@/shared/components/ItemListPanel'
import { useProjects } from '@/entities/project'
import { useAppContext } from '@/shared/hooks/useAppContext'

export default function GlobalDashboard() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const navigate = useNavigate()
  const { organizationId, organization } = useAppContext()
  const hasOrganization = organizationId != null
  const { data: projects = [], isLoading, error } = useProjects(hasOrganization)

  if (!hasOrganization) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Ingen organisasjon ennå
        </h1>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex max-w-xl flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <Building2 className="h-7 w-7 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Du er ikke medlem av en organisasjon ennå
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Du kan vente til noen inviterer deg til en eksisterende
              organisasjon, eller g&#229; tilbake til onboarding for &#229;
              opprette en selv.
            </p>
            <Button
              variant="outline"
              className="mt-5"
              onClick={() =>
                navigate('/onboarding', {
                  state: { fromLimitedMode: true },
                })
              }
            >
              Opprett organisasjon
            </Button>
          </div>
        </div>
      </div>
    )
  }

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
