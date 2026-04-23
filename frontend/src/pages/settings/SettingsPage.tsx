import { useState } from 'react'
import { Building2, FolderKanban, User } from 'lucide-react'
import TabBar, { type TabDef } from '@/shared/components/TabBar'
import { useAppContext } from '@/shared/hooks/useAppContext'
import { useProjects } from '@/entities/project/hooks/useProjects'
import EditOrgSettings from '@/features/edit-settings/ui/EditOrgSettings'
import EditProjectSettings from '@/features/edit-settings/ui/EditProjectSettings'

type Tab = 'personal' | 'organization' | 'projects'

const TABS: TabDef<Tab>[] = [
  { id: 'personal', label: 'Personlig', icon: <User className="h-4 w-4" /> },
  {
    id: 'organization',
    label: 'Organisasjon',
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    id: 'projects',
    label: 'Prosjekter',
    icon: <FolderKanban className="h-4 w-4" />,
  },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('organization')
  const { organizationId } = useAppContext()
  const { data: projects } = useProjects()
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  )

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Innstillinger</h1>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="p-6">
          {activeTab === 'personal' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <User className="h-8 w-8 text-gray-300 mb-3" />
              <p className="text-sm text-gray-400">
                Personlige innstillinger kommer snart
              </p>
            </div>
          )}

          {activeTab === 'organization' && (
            <EditOrgSettings orgId={organizationId} />
          )}

          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="project-select"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Velg prosjekt
                </label>
                <select
                  id="project-select"
                  value={selectedProjectId ?? ''}
                  onChange={(e) =>
                    setSelectedProjectId(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Velg prosjekt...</option>
                  {projects?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.project_number ? ` (${p.project_number})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProjectId != null && (
                <EditProjectSettings projectId={selectedProjectId} />
              )}

              {selectedProjectId == null && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FolderKanban className="h-8 w-8 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-400">
                    Velg et prosjekt for å se innstillingene
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
