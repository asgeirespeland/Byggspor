import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import CreateProjectDialog, {
  type BasicProjectForm,
} from './CreateProjectDialog'

export default function GlobalDashboard() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [search, setSearch] = useState('')

  function handleCreateProject(data: BasicProjectForm) {
    // TODO: wire up to API
    console.log('Nytt prosjekt:', data)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Velkommen til Byggspor</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Prosjekter', value: '—' },
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
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-gray-700">Prosjekter</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Søk prosjekter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-56 h-8 text-sm"
              />
            </div>
            <Button
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Opprett nytt prosjekt
            </Button>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-gray-400">Ingen prosjekter enda</p>
          <p className="mt-1 text-xs text-gray-300">
            Prosjekter vil vises her når de er lagt til
          </p>
        </div>
      </div>

      <CreateProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateProject}
      />
    </div>
  )
}
