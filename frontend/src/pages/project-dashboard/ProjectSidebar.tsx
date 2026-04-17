import { useState } from 'react'
import {
  Leaf,
  FileBarChart2,
  Hash,
  Building2,
  User,
  Receipt,
  Settings,
} from 'lucide-react'
import type { Project } from '@/entities/project/hooks/useProjects'
import ProjectSettingsPanel from '@/pages/settings/ProjectSettingsPanel'
import FullscreenDialog from '@/shared/components/FullscreenDialog'
import ConfidenceGauge from '@/widgets/ConfidenceGauge'
import ConfidenceInfo from './ConfidenceInfo'
import FlaggedItems from './FlaggedItems'
import GenerateInvoiceDialog from '@/entities/export/components/GenerateInvoiceDialog'

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

  return (
    <div className="flex w-full lg:w-60 shrink-0 flex-col gap-3 self-stretch">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
        {/* Confidence score */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            CO₂ Konfidens
          </p>
          <div className="flex justify-center">
            {confidenceScore != null ? (
              <ConfidenceGauge score={Math.round(confidenceScore)} />
            ) : (
              <p className="text-sm text-gray-400 py-4">Ingen data ennå</p>
            )}
          </div>
          <div className="mt-2 flex justify-center">
            <ConfidenceInfo />
          </div>
        </div>

        {/* Project info */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Prosjektinfo
          </p>
          <div className="flex items-start gap-2">
            <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-300" />
            <div>
              <p className="text-xs text-gray-400">Navn</p>
              <p className="text-sm font-medium text-gray-800 leading-tight">
                {project.name}
              </p>
            </div>
          </div>
          {project.project_number && (
            <div className="flex items-start gap-2">
              <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-300" />
              <div>
                <p className="text-xs text-gray-400">Prosjektnummer</p>
                <p className="text-sm font-medium text-gray-800">
                  {project.project_number}
                </p>
              </div>
            </div>
          )}
          {project.customer_name && (
            <div className="flex items-start gap-2">
              <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-300" />
              <div>
                <p className="text-xs text-gray-400">Kunde</p>
                <p className="text-sm font-medium text-gray-800">
                  {project.customer_name}
                </p>
              </div>
            </div>
          )}
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
        className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm text-left hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <Settings className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-700">
          Beregningsinnstillinger
        </span>
      </button>

      <FullscreenDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        title="Beregningsinnstillinger"
        className="sm:max-w-[80vw] max-h-[85vh] overflow-y-auto"
      >
        <ProjectSettingsPanel projectId={project.id} />
      </FullscreenDialog>

      {/* Generate climate report button */}
      <button
        type="button"
        onClick={() => onNavigateToTab?.('report')}
        className="group relative w-full overflow-hidden rounded-xl bg-gray-900 px-4 py-4 text-left shadow-md transition-opacity hover:opacity-90 cursor-pointer"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-transparent opacity-20 pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20">
            <Leaf className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              Generer klimarapport
            </p>
            <p className="text-xs text-gray-400">Vis detaljert CO₂-oversikt</p>
          </div>
          <FileBarChart2 className="ml-auto h-4 w-4 shrink-0 text-gray-500 group-hover:text-emerald-400 transition-colors" />
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
            <p className="text-xs text-gray-400">Med CO₂-data</p>
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
