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
  FileBarChart2,
  Hash,
  Building2,
} from 'lucide-react'
import { useProject } from '@/features/project/hooks/useProject'
import InvoiceUpload from '@/features/invoice/components/InvoiceUpload'
import WasteTab from './tabs/WasteTab'
import EnergyTab from './tabs/EnergyTab'
import type { Project } from '@/features/project/hooks/useProjects'
import { TransportUpload } from '@/features/transport'

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

const STATUS_CONFIG = {
  active: {
    label: 'Aktiv',
    className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  completed: {
    label: 'Fullført',
    className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    dot: 'bg-blue-500',
  },
  archived: {
    label: 'Arkivert',
    className: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
    dot: 'bg-gray-400',
  },
}

function ConfidenceGauge({ score }: { score: number }) {
  const radius = 54
  const cx = 70
  const cy = 72
  const circumference = Math.PI * radius
  const progress = (score / 100) * circumference
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  const label = score >= 75 ? 'Høy' : score >= 50 ? 'Middels' : 'Lav'

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="84" viewBox="0 0 140 84">
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontSize="24"
          fontWeight="700"
          fill="#111827"
        >
          {score}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fontSize="11"
          fill="#9ca3af"
        >
          / 100
        </text>
      </svg>
      <span
        className="mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full"
        style={{ color, backgroundColor: `${color}18` }}
      >
        {label} konfidens
      </span>
    </div>
  )
}

function KpiCard({
  label,
  value,
  unit,
  icon,
  accent,
}: {
  label: string
  value: string | number
  unit: string
  icon: React.ReactNode
  accent: string
}) {
  return (
    <div className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent}`}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-0.5 text-xs text-gray-400">{unit}</p>
    </div>
  )
}

function RightSidebar({ project }: { project: Project }) {
  const confidenceScore = 72

  return (
    <div className="flex w-60 shrink-0 flex-col gap-3 self-stretch">
      {/* Confidence score */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          CO₂ Konfidens
        </p>
        <div className="flex justify-center">
          <ConfidenceGauge score={confidenceScore} />
        </div>
        <p className="mt-3 text-center text-xs leading-relaxed text-gray-400">
          Basert på EPD-dekning og NOBB-kobling
        </p>
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
      </div>

      {/* Flexible spacer */}
      <div className="flex-1" />

      {/* Generate climate report button */}
      <button
        type="button"
        className="group relative w-full overflow-hidden rounded-xl bg-gray-900 px-4 py-4 text-left shadow-md transition-all hover:bg-gray-800 active:scale-[0.98]"
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
            <p className="text-xs text-gray-400">Eksporter som PDF</p>
          </div>
          <FileBarChart2 className="ml-auto h-4 w-4 shrink-0 text-gray-500 transition-colors group-hover:text-emerald-400" />
        </div>
      </button>
    </div>
  )
}

export default function ProjectDashboard() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('materials')
  const state = useProject(Number(projectId))

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
      <div className="flex items-start gap-4">
        {/* Left: KPIs + tabbed content */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {/* KPI row */}
          <div className="flex gap-3">
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
            <div className="flex border-b border-gray-200">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
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

        {/* Right sidebar */}
        <RightSidebar project={project} />
      </div>
    </div>
  )
}
