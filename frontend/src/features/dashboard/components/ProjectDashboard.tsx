import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  ArrowLeft,
  Loader2,
  Package,
  Truck,
  Trash2,
  Zap,
  Leaf,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useProject } from '@/features/project/hooks/useProject'
import { STATUS_CONFIG } from '@/features/project/constants'
import { useScrollIndicators } from '@/shared/hooks/useScrollIndicators'
import InvoiceUpload from '@/features/invoice/components/InvoiceUpload'
import { TransportUpload } from '@/features/transport'
import WasteTab from './tabs/WasteTab'
import EnergyTab from './tabs/EnergyTab'
import KpiCard from './KpiCard'
import ProjectSidebar from './ProjectSidebar'

type Tab = 'materials' | 'transport' | 'waste' | 'energy'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'materials',
    label: 'Materialer',
    icon: <Package className="h-4 w-4" />,
  },
  { id: 'transport', label: 'Transport', icon: <Truck className="h-4 w-4" /> },
  { id: 'waste', label: 'Avfall', icon: <Trash2 className="h-4 w-4" /> },
  { id: 'energy', label: 'Energi', icon: <Zap className="h-4 w-4" /> },
]

export default function ProjectDashboard() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('materials')
  const state = useProject(Number(projectId))
  const {
    ref: tabsRef,
    canScrollLeft,
    canScrollRight,
  } = useScrollIndicators([state.status])

  if (state.status === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Laster prosjekt…</span>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-red-500">{state.message}</p>
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

  const { project } = state
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
            <KpiCard
              label="Totalt CO₂"
              value="—"
              unit="kg CO₂e"
              icon={<Leaf className="h-3.5 w-3.5 text-emerald-600" />}
              accent="bg-emerald-50"
            />
            <KpiCard
              label="Materialer"
              value="—"
              unit="kg CO₂e"
              icon={<Package className="h-3.5 w-3.5 text-blue-600" />}
              accent="bg-blue-50"
            />
            <KpiCard
              label="Transport"
              value="—"
              unit="kg CO₂e"
              icon={<Truck className="h-3.5 w-3.5 text-orange-600" />}
              accent="bg-orange-50"
            />
            <KpiCard
              label="Avfall"
              value="—"
              unit="kg CO₂e"
              icon={<Trash2 className="h-3.5 w-3.5 text-red-500" />}
              accent="bg-red-50"
            />
            <KpiCard
              label="Energi"
              value="—"
              unit="kWh"
              icon={<Zap className="h-3.5 w-3.5 text-yellow-600" />}
              accent="bg-yellow-50"
            />
          </div>

          {/* Tabbed panel */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="relative border-b border-gray-200">
              {canScrollLeft && (
                <div className="pointer-events-none absolute left-0 top-0 z-10 flex h-full w-10 items-center justify-start bg-gradient-to-r from-white via-white/80 to-transparent pl-1">
                  <ChevronLeft className="h-4 w-4 text-gray-400" />
                </div>
              )}
              <div
                ref={tabsRef}
                className="flex overflow-x-auto overflow-y-hidden scrollbar-hide"
              >
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex shrink-0 items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                      activeTab === tab.id
                        ? 'border-gray-900 text-gray-900'
                        : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
              {canScrollRight && (
                <div className="pointer-events-none absolute right-0 top-0 z-10 flex h-full w-10 items-center justify-end bg-gradient-to-l from-white via-white/80 to-transparent pr-1">
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
            <div className="p-6">
              {activeTab === 'materials' && <InvoiceUpload />}
              {activeTab === 'transport' && (
                <TransportUpload projectId={project.id} />
              )}
              {activeTab === 'waste' && <WasteTab />}
              {activeTab === 'energy' && <EnergyTab />}
            </div>
          </div>
        </div>

        {/* Right sidebar — first on mobile, right column on large screens */}
        <div className="order-first lg:order-last w-full lg:w-auto">
          <ProjectSidebar project={project} />
        </div>
      </div>
    </div>
  )
}
