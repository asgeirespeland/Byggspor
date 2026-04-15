import { useState } from 'react'
import {
  Loader2,
  Package,
  Truck,
  Trash2,
  Zap,
  BarChart3,
  Settings2,
} from 'lucide-react'
import { useDetailedReport } from '../hooks/useDetailedReport'
import type { EnergyLineItem } from '../types/report'
import type { Column } from './DataTable'
import DataTable from './DataTable'
import Section from './Section'
import MaterialsSection from './MaterialsSection'
import TransportSection from './TransportSection'
import WasteSection from './WasteSection'
import CategoryDonut from './CategoryDonut'
import TopEmitters from './TopEmitters'
import MethodologySection from './MethodologySection'
import { fmt, sourceLabel, confidenceBadge } from '../utils'

type ReportTab = 'overview' | 'methodology'

const ENERGY_COLUMNS: Column<EnergyLineItem>[] = [
  { header: 'Dato', render: (i) => i.recorded_date ?? '—' },
  { header: 'Prissone', render: (i) => i.price_zone ?? '—' },
  { header: 'kWh', align: 'right', render: (i) => fmt(i.kwh_used) },
  {
    header: 'Utslippsfaktor',
    align: 'right',
    render: (i) => fmt(i.grid_emission_factor, 4),
  },
  {
    header: 'CO₂ (kg)',
    align: 'right',
    render: (i) => <span className="font-medium">{fmt(i.total_co2_kg)}</span>,
  },
  { header: 'Kilde', render: (i) => sourceLabel(i.source) },
  {
    header: 'Konfidens',
    align: 'right',
    render: (i) => confidenceBadge(i.confidence_score),
  },
]

const CATEGORIES = [
  {
    key: 'materials' as const,
    label: 'Materialer',
    icon: Package,
    iconColor: 'text-blue-600',
  },
  {
    key: 'transport' as const,
    label: 'Transport',
    icon: Truck,
    iconColor: 'text-orange-600',
  },
  {
    key: 'waste' as const,
    label: 'Avfall',
    icon: Trash2,
    iconColor: 'text-red-500',
  },
  {
    key: 'energy' as const,
    label: 'Energi',
    icon: Zap,
    iconColor: 'text-yellow-600',
  },
]

export default function ReportView({ projectId }: { projectId: number }) {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview')
  const { data: report, isLoading, error } = useDetailedReport(projectId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Laster rapport…</span>
      </div>
    )
  }

  if (error || !report) {
    return (
      <p className="py-12 text-center text-sm text-red-500">
        {error?.message ?? 'Kunne ikke laste rapport'}
      </p>
    )
  }

  const { categories } = report

  const materialItems = categories.materials.items
  const materialEmissions = materialItems
    .filter((i) => (i.total_co2_kg ?? 0) > 0)
    .reduce((s, i) => s + (i.total_co2_kg ?? 0), 0)
  const materialSequestration = materialItems
    .filter((i) => (i.total_co2_kg ?? 0) < 0)
    .reduce((s, i) => s + (i.total_co2_kg ?? 0), 0)

  const donutCategories = [
    { key: 'materials', label: 'Materialer', co2: materialEmissions },
    {
      key: 'transport',
      label: 'Transport',
      co2: categories.transport.total_co2_kg,
    },
    { key: 'waste', label: 'Avfall', co2: categories.waste.total_co2_kg },
    { key: 'energy', label: 'Energi', co2: categories.energy.total_co2_kg },
  ]

  return (
    <div className="-mt-6 -mb-6">
      {/* Internal tab bar */}
      <div className="flex gap-1 border-b border-gray-200 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'overview'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          Oversikt
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('methodology')}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'methodology'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Settings2 className="h-3.5 w-3.5" />
          Metode og innstillinger
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="pt-4 pb-4 space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto scrollbar-hide">
          {/* Summary panel */}
          <div className="flex flex-col sm:flex-row items-start gap-6 rounded-lg border border-gray-200 bg-white p-5">
            <CategoryDonut
              categories={donutCategories}
              total={report.total_co2_kg}
              sequestration={materialSequestration}
            />
            <div className="flex-1 min-w-0">
              <TopEmitters
                report={report}
                materialEmissions={materialEmissions}
                materialSequestration={materialSequestration}
              />
            </div>
          </div>

          {/* Category sections */}
          {CATEGORIES.map(({ key, label, icon: Icon, iconColor }, idx) => (
            <Section
              key={key}
              title={label}
              icon={<Icon className={`h-4 w-4 ${iconColor}`} />}
              totalCo2={categories[key].total_co2_kg}
              entryCount={categories[key].entry_count}
              avgConfidence={categories[key].avg_confidence}
              defaultOpen={idx === 0}
            >
              {key === 'materials' ? (
                <MaterialsSection items={categories.materials.items} />
              ) : key === 'transport' ? (
                <TransportSection items={categories.transport.items} />
              ) : key === 'waste' ? (
                <WasteSection items={categories.waste.items} />
              ) : (
                <DataTable
                  items={categories.energy.items}
                  columns={ENERGY_COLUMNS}
                  emptyMessage="Ingen energidata registrert."
                />
              )}
            </Section>
          ))}
        </div>
      ) : (
        <div className="pt-4 pb-4 max-h-[calc(100vh-20rem)] overflow-y-auto scrollbar-hide">
          <MethodologySection
            settings={report.settings}
            dataSources={report.data_sources}
          />
        </div>
      )}
    </div>
  )
}
