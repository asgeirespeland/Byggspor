/**
 * Project detail page. Owns tab state and wires breadcrumb, KPI row, tabbed content
 * (materials/transport/waste/energy/report), right sidebar, and first-visit climate-tab tour.
 * Each tab's content is declared inline on the TABS array via the render field on TabDef.
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useDeferredLoading } from '@/shared/hooks/useDeferredLoading'
import { ArrowLeft, HelpCircle, Loader2, FileText } from 'lucide-react'
import { useProject } from '@/entities/project/hooks/useProjects'
import { STATUS_CONFIG } from '@/entities/project/constants'
import TabBar, { type TabDef } from '@/shared/components/TabBar'
import InvoiceUpload from '@/entities/materials/ui/InvoiceUpload'
import TransportUpload from '@/entities/transport/ui/TransportUpload'
import WasteUpload from '@/entities/waste/ui/WasteUpload'
import EnergyInput from '@/entities/energy/ui/EnergyInput'
import ReportView from '@/entities/report/ui/ReportView'
import { useCo2Summary } from '@/entities/report/hooks/useCo2Summary'
import {
  CATEGORY_THEME,
  CATEGORY_KEYS,
  type CategoryOrTotal,
} from '@/entities/report/theme'
import KpiCard from './KpiCard'
import ProjectSidebar from './ProjectSidebar'
import ClimateTabTour from '@/pages/onboarding/ClimateTabTour'
import { useClimateTabTour } from '@/pages/onboarding/hooks/useClimateTabTour'

function formatKg(value: number | undefined): string {
  if (value == null || value === 0) return '—'
  return value.toLocaleString('nb-NO', { maximumFractionDigits: 1 })
}

type Tab = 'materials' | 'transport' | 'waste' | 'energy' | 'report'

const TAB_RENDERERS: Record<
  Exclude<Tab, 'report'>,
  (projectId: number) => React.ReactNode
> = {
  materials: (id) => <InvoiceUpload projectId={id} />,
  transport: (id) => <TransportUpload projectId={id} />,
  waste: (id) => <WasteUpload projectId={id} />,
  energy: (id) => <EnergyInput projectId={id} />,
}

function buildTabs(projectId: number): TabDef<Tab>[] {
  const categoryTabs: TabDef<Tab>[] = CATEGORY_KEYS.map((key) => {
    const theme = CATEGORY_THEME[key]
    return {
      id: key,
      label: theme.label,
      icon: <theme.Icon className="h-4 w-4" />,
      activeClassName: `border-${key} ${theme.textStrong}`,
      render: () => TAB_RENDERERS[key](projectId),
    }
  })
  const total = CATEGORY_THEME.total
  return [
    ...categoryTabs,
    {
      id: 'report',
      label: 'Rapport',
      icon: <FileText className="h-4 w-4" />,
      className: total.bgSoft,
      activeClassName: `border-total ${total.textStrong}`,
      render: () => <ReportView projectId={projectId} />,
    },
  ]
}

const KPI_KEYS: readonly CategoryOrTotal[] = ['total', ...CATEGORY_KEYS]

function getKpiValue(
  co2: ReturnType<typeof useCo2Summary>['data'],
  key: CategoryOrTotal,
): string {
  if (!co2) return '—'
  if (key === 'total') return formatKg(co2.total_co2_kg)
  return formatKg(co2.categories[key]?.total_co2_kg)
}

export default function ProjectDashboard() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('materials')
  const { data: project, isLoading, error } = useProject(Number(projectId))
  const { data: co2 } = useCo2Summary(Number(projectId))
  const showLoading = useDeferredLoading(isLoading)
  const tour = useClimateTabTour()

  if (showLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Laster prosjekt…</span>
      </div>
    )
  }

  if (isLoading) return null

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-danger">
          {error?.message ?? 'Kunne ikke laste prosjekt'}
        </p>
        <button
          type="button"
          className="mt-3 text-xs text-gray-400 underline"
          onClick={() => navigate('/')}
        >
          Tilbake til dashboard
        </button>
      </div>
    )
  }

  const status = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.active
  const tabs = buildTabs(project.id)

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbake
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-700">
          {project.name}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>

        <button
          type="button"
          onClick={tour.restart}
          title="Vis omvisning"
          className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          Omvisning
        </button>
      </div>

      {/* Main layout: left content + right sidebar */}
      <div className="flex flex-col lg:flex-row items-start gap-4">
        {/* Left: KPIs + tabbed content */}
        <div className="flex min-w-0 flex-1 flex-col gap-4 w-full">
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {KPI_KEYS.map((key) => {
              const theme = CATEGORY_THEME[key]
              return (
                <KpiCard
                  key={key}
                  label={theme.label}
                  value={getKpiValue(co2, key)}
                  unit="kg CO₂e"
                  icon={
                    <theme.Icon className={`h-3.5 w-3.5 ${theme.textStrong}`} />
                  }
                  accent={theme.bgSoft}
                />
              )
            })}
          </div>

          {/* Tabbed panel */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <TabBar
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              scrollDeps={[isLoading]}
            />
            <div className="p-6 min-h-[30rem]">
              {tabs.find((t) => t.id === activeTab)?.render?.()}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="order-first lg:order-last w-full lg:w-auto">
          <ProjectSidebar
            project={project}
            confidenceScore={co2?.overall_confidence ?? null}
            onNavigateToTab={setActiveTab}
          />
        </div>
      </div>

      <ClimateTabTour
        open={tour.open}
        step={tour.step}
        onNext={tour.next}
        onPrev={tour.prev}
        onClose={tour.close}
      />
    </div>
  )
}
