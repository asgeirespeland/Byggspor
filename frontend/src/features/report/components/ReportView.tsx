import { Loader2, Package, Truck, Trash2, Zap } from 'lucide-react'
import { useDetailedReport } from '../hooks/useDetailedReport'
import type {
  TransportLineItem,
  WasteLineItem,
  EnergyLineItem,
} from '../types/report'
import type { Column } from './DataTable'
import DataTable from './DataTable'
import Section from './Section'
import MaterialsSection from './MaterialsSection'
import CategoryDonut from './CategoryDonut'
import TopEmitters from './TopEmitters'
import { fmt, sourceLabel, confidenceBadge } from '../utils'

const TRANSPORT_COLUMNS: Column<TransportLineItem>[] = [
  { header: 'Dato', render: (i) => i.trip_date ?? '—' },
  {
    header: 'Kjøretøy',
    render: (i) =>
      i.vehicle
        ? `${i.vehicle.make ?? ''} ${i.vehicle.model ?? ''} (${i.vehicle.registration_number})`.trim()
        : '—',
  },
  { header: 'Fra', render: (i) => i.start_address ?? '—' },
  { header: 'Til', render: (i) => i.end_address ?? '—' },
  { header: 'Km', align: 'right', render: (i) => fmt(i.distance_km) },
  {
    header: 'CO₂ (kg)',
    align: 'right',
    render: (i) => <span className="font-medium">{fmt(i.total_co2_kg)}</span>,
  },
  { header: 'Kilde', render: (i) => sourceLabel(i.source_type) },
  {
    header: 'Tillit',
    align: 'right',
    render: (i) => confidenceBadge(i.confidence_score),
  },
]

const WASTE_COLUMNS: Column<WasteLineItem>[] = [
  { header: 'Avfallstype', render: (i) => i.waste_type ?? '—' },
  {
    header: 'Tonn',
    align: 'right',
    render: (i) => fmt(i.quantity_tons, 3),
  },
  {
    header: 'CO₂ (kg)',
    align: 'right',
    render: (i) => <span className="font-medium">{fmt(i.total_co2_kg)}</span>,
  },
  { header: 'Kilde', render: (i) => sourceLabel(i.source_type) },
  {
    header: 'Tillit',
    align: 'right',
    render: (i) => confidenceBadge(i.confidence_score),
  },
]

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
    header: 'Tillit',
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

  const allCo2 = [
    ...categories.materials.items,
    ...categories.transport.items,
    ...categories.waste.items,
    ...categories.energy.items,
  ].map((i) => i.total_co2_kg ?? 0)

  const gross = allCo2.filter((v) => v > 0).reduce((s, v) => s + v, 0)
  const sequestration = allCo2.filter((v) => v < 0).reduce((s, v) => s + v, 0)

  return (
    <div className="space-y-4">
      {/* Summary panel */}
      <div className="flex flex-col sm:flex-row items-start gap-6 rounded-lg border border-gray-200 bg-white p-5">
        <CategoryDonut
          categories={CATEGORIES.map((c) => ({
            key: c.key,
            label: c.label,
            co2: categories[c.key].total_co2_kg,
          }))}
          total={report.total_co2_kg}
        />
        <div className="flex-1 min-w-0">
          <TopEmitters report={report} />
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
            <DataTable
              items={categories.transport.items}
              columns={TRANSPORT_COLUMNS}
              emptyMessage="Ingen transport registrert."
            />
          ) : key === 'waste' ? (
            <DataTable
              items={categories.waste.items}
              columns={WASTE_COLUMNS}
              emptyMessage="Ingen avfall registrert."
            />
          ) : (
            <DataTable
              items={categories.energy.items}
              columns={ENERGY_COLUMNS}
              emptyMessage="Ingen energidata registrert."
            />
          )}
        </Section>
      ))}

      {/* Grand total */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Netto prosjekt
          </span>
          <span className="text-sm font-semibold text-gray-900">
            {fmt(report.total_co2_kg)} kg CO₂e
          </span>
        </div>
        {sequestration < 0 && (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Brutto {fmt(gross)} kg · Karbonbinding{' '}
              <span className="text-emerald-600">
                −{fmt(Math.abs(sequestration))} kg
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
