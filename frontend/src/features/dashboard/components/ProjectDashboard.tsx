import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useDeferredLoading } from '@/shared/hooks/useDeferredLoading'
import {
  ArrowLeft,
  Loader2,
  Package,
  Truck,
  Trash2,
  Zap,
  Leaf,
  FileText,
} from 'lucide-react'
import { useProject } from '@/features/project/hooks/useProject'
import { STATUS_CONFIG } from '@/features/project/constants'
import TabBar, { type TabDef } from '@/shared/components/TabBar'
import InvoiceUpload from '@/features/invoice/components/InvoiceUpload'
import { TransportUpload } from '@/features/transport'
import { useCo2Summary } from '../hooks/useCo2Summary'
import WasteTab from './tabs/WasteTab'
import EnergyTab from './tabs/EnergyTab'
import ReportTab from './tabs/ReportTab'
import KpiCard from './KpiCard'
import ProjectSidebar from './ProjectSidebar'

function formatKg(value: number | undefined): string {
  if (value == null || value === 0) return '—'
  return value.toLocaleString('nb-NO', { maximumFractionDigits: 1 })
}

type Tab = 'materials' | 'transport' | 'waste' | 'energy' | 'report'

const TABS: TabDef<Tab>[] = [
  {
    id: 'materials',
    label: 'Materialer',
    icon: <Package className="h-4 w-4" />,
  },
  { id: 'transport', label: 'Transport', icon: <Truck className="h-4 w-4" /> },
  { id: 'waste', label: 'Avfall', icon: <Trash2 className="h-4 w-4" /> },
  { id: 'energy', label: 'Energi', icon: <Zap className="h-4 w-4" /> },
  { id: 'report', label: 'Rapport', icon: <FileText className="h-4 w-4" /> },
]

const KPI_CONFIG = [
  {
    label: 'Totalt CO₂',
    key: 'total' as const,
    icon: <Leaf className="h-3.5 w-3.5 text-emerald-600" />,
    accent: 'bg-emerald-50',
  },
  {
    label: 'Materialer',
    key: 'materials' as const,
    icon: <Package className="h-3.5 w-3.5 text-blue-600" />,
    accent: 'bg-blue-50',
  },
  {
    label: 'Transport',
    key: 'transport' as const,
    icon: <Truck className="h-3.5 w-3.5 text-orange-600" />,
    accent: 'bg-orange-50',
  },
  {
    label: 'Avfall',
    key: 'waste' as const,
    icon: <Trash2 className="h-3.5 w-3.5 text-red-500" />,
    accent: 'bg-red-50',
  },
  {
    label: 'Energi',
    key: 'energy' as const,
    icon: <Zap className="h-3.5 w-3.5 text-yellow-600" />,
    accent: 'bg-yellow-50',
  },
]

function getKpiValue(
  co2: ReturnType<typeof useCo2Summary>['data'],
  key: (typeof KPI_CONFIG)[number]['key'],
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
        <p className="text-sm text-red-500">
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
      </div>

      {/* Main layout: left content + right sidebar */}
      <div className="flex flex-col lg:flex-row items-start gap-4">
        {/* Left: KPIs + tabbed content */}
        <div className="flex min-w-0 flex-1 flex-col gap-4 w-full">
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {KPI_CONFIG.map((kpi) => (
              <KpiCard
                key={kpi.key}
                label={kpi.label}
                value={getKpiValue(co2, kpi.key)}
                unit="kg CO₂e"
                icon={kpi.icon}
                accent={kpi.accent}
              />
            ))}
          </div>

          {/* Tabbed panel */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <TabBar
              tabs={TABS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              scrollDeps={[isLoading]}
            />
            <div className="p-6">
              {activeTab === 'materials' && (
                <InvoiceUpload projectId={project.id} />
              )}
              {activeTab === 'transport' && (
                <TransportUpload projectId={project.id} />
              )}
              {activeTab === 'waste' && <WasteTab projectId={project.id} />}
              {activeTab === 'energy' && <EnergyTab projectId={project.id} />}
              {activeTab === 'report' && <ReportTab projectId={project.id} />}
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
    </div>
  )
}
