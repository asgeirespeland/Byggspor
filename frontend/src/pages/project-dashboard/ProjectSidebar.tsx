/**
 * Right-rail panel on the project dashboard: confidence gauge + help modal, project metadata,
 * FlaggedItems list, settings button (opens EditProjectSettings in a fullscreen dialog), generate
 * climate report CTA (routes to report tab), and generate EHF invoice CTA (opens GenerateInvoiceDialog).
 */
import { useState } from 'react'
import {
  Leaf,
  FileBarChart2,
  Hash,
  Building2,
  User,
  Receipt,
  Settings,
  Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Project } from '@/entities/project'
import { useUpdateProject } from '@/features/edit-project/hooks/useUpdateProject'
import { EditProjectSettings } from '@/features/edit-settings'
import FullscreenDialog from '@/shared/components/FullscreenDialog'
import ConfidenceGauge from '@/widgets/ConfidenceGauge'
import ConfidenceInfo from './ConfidenceInfo'
import { FlaggedItems } from '@/widgets/flagged-items'
import { GenerateInvoiceDialog } from '@/features/generate-invoice'

export default function ProjectSidebar({
  project,
  confidenceScore,
  onNavigateToTab,
}: {
  project: Project
  confidenceScore: number | null
  onNavigateToTab?: (
    tab: 'materials' | 'transport' | 'waste' | 'energy' | 'report',
  ) => void
}) {
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [draftName, setDraftName] = useState(project.name)

  const updateProjectMutation = useUpdateProject(project.id)

  function handleStartEditName() {
    setDraftName(project.name)
    setIsEditingName(true)
  }

  function handleCancelEditName() {
    setDraftName(project.name)
    setIsEditingName(false)
  }

  async function handleSaveName() {
    const trimmed = draftName.trim()
    if (!trimmed) return

    await updateProjectMutation.mutateAsync({ name: trimmed })
    setIsEditingName(false)
  }

  return (
    <div className="flex w-full lg:w-60 shrink-0 flex-col gap-3 self-stretch">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
        {/* Project info */}
        <div className="col-span-2 lg:col-span-1 rounded-xl border border-border bg-card p-4 shadow-sm space-y-3 overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Prosjektinfo
          </p>
          <div className="flex items-start gap-2 min-w-0">
            <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Navn</p>

              {isEditingName ? (
                <div className="mt-1 space-y-2 w-full">
                  <Input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleSaveName()
                      if (e.key === 'Escape') handleCancelEditName()
                    }}
                    disabled={updateProjectMutation.isPending}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => void handleSaveName()}
                      disabled={
                        updateProjectMutation.isPending || !draftName.trim()
                      }
                    >
                      Lagre
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={handleCancelEditName}
                      disabled={updateProjectMutation.isPending}
                    >
                      Avbryt
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground leading-tight min-w-0 truncate">
                    {project.name}
                  </p>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0 text-muted-foreground"
                    onClick={handleStartEditName}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          {project.project_number && (
            <div className="flex items-start gap-2">
              <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Prosjektnummer</p>
                <p className="text-sm font-medium text-foreground">
                  {project.project_number}
                </p>
              </div>
            </div>
          )}
          {project.customer_name && (
            <div className="flex items-start gap-2">
              <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Kunde</p>
                <p className="text-sm font-medium text-foreground">
                  {project.customer_name}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Confidence score */}
        <div className="col-span-2 lg:col-span-1 rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            CO₂ Konfidens
          </p>
          <div className="flex justify-center">
            {confidenceScore != null ? (
              <ConfidenceGauge score={Math.round(confidenceScore)} />
            ) : (
              <p className="text-sm text-muted-foreground py-4">
                Ingen data ennå
              </p>
            )}
          </div>
          <div className="mt-2 flex justify-center">
            <ConfidenceInfo />
          </div>
        </div>
      </div>
      {/* end grid */}

      {/* Flagged items needing attention */}
      <FlaggedItems projectId={project.id} onNavigateToTab={onNavigateToTab} />

      {/* Flexible spacer */}
      <div className="flex-1" />

      {/* Project settings */}
      <button
        type="button"
        onClick={() => setSettingsOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm text-left hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <Settings className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Beregningsinnstillinger
        </span>
      </button>

      <FullscreenDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        title="Beregningsinnstillinger"
        className="sm:max-w-[80vw] max-h-[85vh] overflow-y-auto"
      >
        <EditProjectSettings projectId={project.id} />
      </FullscreenDialog>

      {/* Generate climate report button */}
      <button
        type="button"
        onClick={() => onNavigateToTab?.('report')}
        className="group relative w-full overflow-hidden rounded-xl bg-gray-900 px-4 py-4 text-left shadow-md transition-opacity hover:opacity-90 cursor-pointer"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-carbon to-transparent opacity-20 pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-total/20">
            <Leaf className="h-4 w-4 text-carbon" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              Generer klimarapport
            </p>
            <p className="text-xs text-muted-foreground">
              Vis detaljert CO₂-oversikt
            </p>
          </div>
          <FileBarChart2 className="ml-auto h-4 w-4 shrink-0 text-muted-foreground group-hover:text-carbon transition-colors" />
        </div>
      </button>

      {/* Generate EHF invoice button */}
      <button
        type="button"
        onClick={() => setInvoiceOpen(true)}
        className="group relative w-full overflow-hidden rounded-xl bg-gray-900 px-4 py-4 text-left shadow-md transition-opacity hover:opacity-90"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-transparent opacity-20 pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/20">
            <Receipt className="h-4 w-4 text-violet-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              Generer EHF-faktura
            </p>
            <p className="text-xs text-muted-foreground">Med CO₂-data</p>
          </div>
        </div>
      </button>

      <GenerateInvoiceDialog
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        project={project}
      />
    </div>
  )
}
