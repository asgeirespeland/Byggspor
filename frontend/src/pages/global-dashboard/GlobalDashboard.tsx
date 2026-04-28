/**
 * Organization-level landing page.
 */
import { useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useAuth } from '@clerk/react'
import { CreateProjectDialog } from '@/features/create-project'
import ProjectCard from './ProjectCard'
import ItemListPanel from '@/shared/components/ItemListPanel'
import { useProjects } from '@/entities/project'
import { useAppContext } from '@/shared/hooks/useAppContext'
import { getCo2Summary } from '@/entities/report/api/co2Summary'
import { getTokenOrThrow } from '@/shared/auth/getToken'
import { qk } from '@/shared/api/queryKeys'

function formatCo2(kg: number): string {
  if (kg >= 1000)
    return `${(kg / 1000).toLocaleString('nb-NO', { maximumFractionDigits: 1 })} t`
  return `${Math.round(kg).toLocaleString('nb-NO')} kg`
}

export default function GlobalDashboard() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { organization } = useAppContext()
  const { data: projects = [], isLoading, error } = useProjects()
  const { getToken } = useAuth()

  const co2Queries = useQueries({
    queries: projects.map((p) => ({
      queryKey: qk.co2Summary(p.id),
      queryFn: async () => getCo2Summary(p.id, await getTokenOrThrow(getToken)),
      enabled: projects.length > 0,
    })),
  })

  const totalCo2Kg = co2Queries.every((q) => q.isSuccess)
    ? co2Queries.reduce((sum, q) => sum + (q.data?.total_co2_kg ?? 0), 0)
    : null

  const activeCount = !isLoading
    ? projects.filter((p) => p.status === 'active').length
    : null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">
        {organization?.name ?? 'Dashboard'}
      </h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {[
          {
            label: 'Prosjekter',
            value: !isLoading ? projects.length : '—',
          },
          {
            label: 'Aktive prosjekter',
            value: activeCount ?? '—',
          },
          {
            label: 'Total CO₂',
            value: totalCo2Kg !== null ? formatCo2(totalCo2Kg) : '—',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border bg-card p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

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
