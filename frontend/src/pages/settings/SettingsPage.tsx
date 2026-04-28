import { useState } from 'react'
import { Building2, FolderKanban, Moon, Sun, User } from 'lucide-react'
import TabBar, { type TabDef } from '@/shared/components/TabBar'
import { useAppContext } from '@/shared/hooks/useAppContext'
import { useTheme } from '@/shared/hooks/useTheme'
import { useProjects } from '@/entities/project'
import { EditOrgSettings } from '@/features/edit-settings'
import { EditProjectSettings } from '@/features/edit-settings'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

function PersonalSettings() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-4">Utseende</h3>
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-3">
            {isDark ? (
              <Moon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Sun className="h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">Dark mode</p>
              <p className="text-xs text-muted-foreground">
                {isDark ? 'På' : 'Av'}
              </p>
            </div>
          </div>
          <Switch checked={isDark} onCheckedChange={toggleTheme} />
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('organization')
  const { organizationId } = useAppContext()
  const { data: projects } = useProjects()
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  )

  const selectedProject = projects?.find((p) => p.id === selectedProjectId)
  const selectedLabel = selectedProject
    ? `${selectedProject.name}${selectedProject.project_number ? ` (${selectedProject.project_number})` : ''}`
    : undefined

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Innstillinger</h1>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="p-6">
          {activeTab === 'personal' && <PersonalSettings />}

          {activeTab === 'organization' && (
            <EditOrgSettings orgId={organizationId} />
          )}

          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Velg prosjekt
                </label>
                <Select
                  value={
                    selectedProjectId != null ? String(selectedProjectId) : ''
                  }
                  onValueChange={(val) =>
                    setSelectedProjectId(val ? Number(val) : null)
                  }
                >
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Velg prosjekt...">
                      {selectedLabel}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                        {p.project_number ? ` (${p.project_number})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProjectId != null && (
                <EditProjectSettings projectId={selectedProjectId} />
              )}

              {selectedProjectId == null && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FolderKanban className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
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
