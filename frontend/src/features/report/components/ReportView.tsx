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

  return (
    <div className="space-y-3">
      <Section
        title="Materialer"
        icon={<Package className="h-4 w-4 text-blue-600" />}
        totalCo2={categories.materials.total_co2_kg}
        entryCount={categories.materials.entry_count}
        avgConfidence={categories.materials.avg_confidence}
        defaultOpen
      >
        <MaterialsSection items={categories.materials.items} />
      </Section>

      <Section
        title="Transport"
        icon={<Truck className="h-4 w-4 text-orange-600" />}
        totalCo2={categories.transport.total_co2_kg}
        entryCount={categories.transport.entry_count}
        avgConfidence={categories.transport.avg_confidence}
      >
        <DataTable
          items={categories.transport.items}
          columns={TRANSPORT_COLUMNS}
          emptyMessage="Ingen transport registrert."
        />
      </Section>

      <Section
        title="Avfall"
        icon={<Trash2 className="h-4 w-4 text-red-500" />}
        totalCo2={categories.waste.total_co2_kg}
        entryCount={categories.waste.entry_count}
        avgConfidence={categories.waste.avg_confidence}
      >
        <DataTable
          items={categories.waste.items}
          columns={WASTE_COLUMNS}
          emptyMessage="Ingen avfall registrert."
        />
      </Section>

      <Section
        title="Energi"
        icon={<Zap className="h-4 w-4 text-yellow-600" />}
        totalCo2={categories.energy.total_co2_kg}
        entryCount={categories.energy.entry_count}
        avgConfidence={categories.energy.avg_confidence}
      >
        <DataTable
          items={categories.energy.items}
          columns={ENERGY_COLUMNS}
          emptyMessage="Ingen energidata registrert."
        />
      </Section>

      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <span className="text-sm font-medium text-gray-700">
          Totalt prosjekt
        </span>
        <span className="text-sm font-semibold text-gray-900">
          {fmt(report.total_co2_kg)} kg CO₂e
        </span>
      </div>
    </div>
  )
}
