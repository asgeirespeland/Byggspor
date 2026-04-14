import { useState } from 'react'
import {
  Loader2,
  ChevronDown,
  ChevronRight,
  Package,
  Truck,
  Trash2,
  Zap,
} from 'lucide-react'
import { useDetailedReport } from '../../hooks/useDetailedReport'
import type {
  MaterialLineItem,
  TransportLineItem,
  WasteLineItem,
  EnergyLineItem,
} from '../../api/report'

interface ReportTabProps {
  projectId: number
}

function fmt(value: number | null | undefined, decimals = 1): string {
  if (value == null || value === 0) return '—'
  return value.toLocaleString('nb-NO', { maximumFractionDigits: decimals })
}

function confidenceBadge(score: number | null) {
  if (score == null) return <span className="text-gray-300">—</span>
  const color =
    score >= 80
      ? 'bg-emerald-50 text-emerald-700'
      : score >= 50
        ? 'bg-yellow-50 text-yellow-700'
        : 'bg-red-50 text-red-700'
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
    >
      {score}%
    </span>
  )
}

function sourceLabel(sourceType: string | null): string {
  switch (sourceType) {
    case 'ehf_invoice':
      return 'EHF-faktura'
    case 'manual':
      return 'Manuell'
    case 'csv_import':
      return 'CSV-import'
    case 'abax_xml':
      return 'Abax XML'
    case 'waste_report':
      return 'Avfallsrapport'
    case 'file':
      return 'Fil'
    default:
      return sourceType ?? '—'
  }
}

// --- Collapsible section ---

function Section({
  title,
  icon,
  totalCo2,
  entryCount,
  avgConfidence,
  defaultOpen = false,
  children,
}: {
  title: string
  icon: React.ReactNode
  totalCo2: number
  entryCount: number
  avgConfidence: number | null
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left cursor-pointer hover:bg-gray-50 transition-colors"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
        )}
        <span className="shrink-0">{icon}</span>
        <span className="text-sm font-medium text-gray-800">{title}</span>
        <span className="ml-auto flex items-center gap-4 text-xs text-gray-500">
          <span>{entryCount} poster</span>
          {avgConfidence != null && <span>snitt {avgConfidence}%</span>}
          <span className="font-medium text-gray-700">
            {fmt(totalCo2)} kg CO₂e
          </span>
        </span>
      </button>
      {open && (
        <div className="border-t border-gray-100 overflow-x-auto">
          {children}
        </div>
      )}
    </div>
  )
}

// --- Supplier grouping for materials ---

function groupBySupplier(items: MaterialLineItem[]) {
  const groups = new Map<string, MaterialLineItem[]>()
  for (const item of items) {
    const key = item.supplier_name ?? 'Ukjent leverandør'
    const list = groups.get(key)
    if (list) {
      list.push(item)
    } else {
      groups.set(key, [item])
    }
  }
  return groups
}

// --- Category tables ---

function MaterialsTable({ items }: { items: MaterialLineItem[] }) {
  const grouped = groupBySupplier(items)

  if (items.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-gray-400">
        Ingen materialer registrert.
      </p>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {[...grouped.entries()].map(([supplier, group]) => (
        <SupplierGroup key={supplier} supplier={supplier} items={group} />
      ))}
    </div>
  )
}

function SupplierGroup({
  supplier,
  items,
}: {
  supplier: string
  items: MaterialLineItem[]
}) {
  const [open, setOpen] = useState(false)
  const subtotal = items.reduce((s, i) => s + (i.total_co2_kg ?? 0), 0)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-6 py-2 text-left text-xs cursor-pointer hover:bg-gray-50"
      >
        {open ? (
          <ChevronDown className="h-3 w-3 text-gray-400" />
        ) : (
          <ChevronRight className="h-3 w-3 text-gray-400" />
        )}
        <span className="font-medium text-gray-700">{supplier}</span>
        <span className="ml-auto text-gray-500">
          {items.length} linjer · {fmt(subtotal)} kg CO₂e
        </span>
      </button>
      {open && (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-400">
              <th className="px-6 py-1.5 font-normal">Produkt</th>
              <th className="px-3 py-1.5 font-normal">NOBB</th>
              <th className="px-3 py-1.5 font-normal text-right">Antall</th>
              <th className="px-3 py-1.5 font-normal">Enhet</th>
              <th className="px-3 py-1.5 font-normal text-right">GWP/enhet</th>
              <th className="px-3 py-1.5 font-normal text-right">CO₂ (kg)</th>
              <th className="px-3 py-1.5 font-normal">EPD</th>
              <th className="px-3 py-1.5 font-normal">Kilde</th>
              <th className="px-3 py-1.5 font-normal text-right">Tillit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((item) => (
              <tr key={item.id} className="text-gray-600">
                <td className="px-6 py-1.5 max-w-[200px] truncate">
                  {item.product_name ?? '—'}
                </td>
                <td className="px-3 py-1.5 font-mono">
                  {item.nobb_number ?? '—'}
                </td>
                <td className="px-3 py-1.5 text-right">
                  {fmt(item.quantity, 2)}
                </td>
                <td className="px-3 py-1.5">{item.unit ?? '—'}</td>
                <td className="px-3 py-1.5 text-right">
                  {fmt(item.gwp_per_unit, 4)}
                </td>
                <td className="px-3 py-1.5 text-right font-medium">
                  {fmt(item.total_co2_kg)}
                </td>
                <td className="px-3 py-1.5">
                  {item.has_epd ? (
                    <span
                      className="text-emerald-600"
                      title={item.epd_id ?? undefined}
                    >
                      {item.epd_id ?? 'Ja'}
                    </span>
                  ) : (
                    <span className="text-gray-300">Nei</span>
                  )}
                </td>
                <td className="px-3 py-1.5">{sourceLabel(item.source_type)}</td>
                <td className="px-3 py-1.5 text-right">
                  {confidenceBadge(item.confidence_score)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function TransportTable({ items }: { items: TransportLineItem[] }) {
  if (items.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-gray-400">
        Ingen transport registrert.
      </p>
    )
  }

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-gray-100 text-left text-gray-400">
          <th className="px-4 py-2 font-normal">Dato</th>
          <th className="px-3 py-2 font-normal">Kjøretøy</th>
          <th className="px-3 py-2 font-normal">Fra</th>
          <th className="px-3 py-2 font-normal">Til</th>
          <th className="px-3 py-2 font-normal text-right">Km</th>
          <th className="px-3 py-2 font-normal text-right">CO₂ (kg)</th>
          <th className="px-3 py-2 font-normal">Kilde</th>
          <th className="px-3 py-2 font-normal text-right">Tillit</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {items.map((item) => (
          <tr key={item.id} className="text-gray-600">
            <td className="px-4 py-1.5">{item.trip_date ?? '—'}</td>
            <td className="px-3 py-1.5">
              {item.vehicle
                ? `${item.vehicle.make ?? ''} ${item.vehicle.model ?? ''} (${item.vehicle.registration_number})`.trim()
                : '—'}
            </td>
            <td className="px-3 py-1.5 max-w-[160px] truncate">
              {item.start_address ?? '—'}
            </td>
            <td className="px-3 py-1.5 max-w-[160px] truncate">
              {item.end_address ?? '—'}
            </td>
            <td className="px-3 py-1.5 text-right">
              {fmt(item.distance_km, 1)}
            </td>
            <td className="px-3 py-1.5 text-right font-medium">
              {fmt(item.total_co2_kg)}
            </td>
            <td className="px-3 py-1.5">{sourceLabel(item.source_type)}</td>
            <td className="px-3 py-1.5 text-right">
              {confidenceBadge(item.confidence_score)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function WasteTable({ items }: { items: WasteLineItem[] }) {
  if (items.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-gray-400">
        Ingen avfall registrert.
      </p>
    )
  }

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-gray-100 text-left text-gray-400">
          <th className="px-4 py-2 font-normal">Avfallstype</th>
          <th className="px-3 py-2 font-normal text-right">Tonn</th>
          <th className="px-3 py-2 font-normal text-right">CO₂ (kg)</th>
          <th className="px-3 py-2 font-normal">Kilde</th>
          <th className="px-3 py-2 font-normal text-right">Tillit</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {items.map((item) => (
          <tr key={item.id} className="text-gray-600">
            <td className="px-4 py-1.5">{item.waste_type ?? '—'}</td>
            <td className="px-3 py-1.5 text-right">
              {fmt(item.quantity_tons, 3)}
            </td>
            <td className="px-3 py-1.5 text-right font-medium">
              {fmt(item.total_co2_kg)}
            </td>
            <td className="px-3 py-1.5">{sourceLabel(item.source_type)}</td>
            <td className="px-3 py-1.5 text-right">
              {confidenceBadge(item.confidence_score)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function EnergyTable({ items }: { items: EnergyLineItem[] }) {
  if (items.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-gray-400">
        Ingen energidata registrert.
      </p>
    )
  }

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-gray-100 text-left text-gray-400">
          <th className="px-4 py-2 font-normal">Dato</th>
          <th className="px-3 py-2 font-normal">Prissone</th>
          <th className="px-3 py-2 font-normal text-right">kWh</th>
          <th className="px-3 py-2 font-normal text-right">Utslippsfaktor</th>
          <th className="px-3 py-2 font-normal text-right">CO₂ (kg)</th>
          <th className="px-3 py-2 font-normal">Kilde</th>
          <th className="px-3 py-2 font-normal text-right">Tillit</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {items.map((item) => (
          <tr key={item.id} className="text-gray-600">
            <td className="px-4 py-1.5">{item.recorded_date ?? '—'}</td>
            <td className="px-3 py-1.5">{item.price_zone ?? '—'}</td>
            <td className="px-3 py-1.5 text-right">{fmt(item.kwh_used, 1)}</td>
            <td className="px-3 py-1.5 text-right">
              {fmt(item.grid_emission_factor, 4)}
            </td>
            <td className="px-3 py-1.5 text-right font-medium">
              {fmt(item.total_co2_kg)}
            </td>
            <td className="px-3 py-1.5">{sourceLabel(item.source)}</td>
            <td className="px-3 py-1.5 text-right">
              {confidenceBadge(item.confidence_score)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// --- Main component ---

export default function ReportTab({ projectId }: ReportTabProps) {
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
        <MaterialsTable items={categories.materials.items} />
      </Section>

      <Section
        title="Transport"
        icon={<Truck className="h-4 w-4 text-orange-600" />}
        totalCo2={categories.transport.total_co2_kg}
        entryCount={categories.transport.entry_count}
        avgConfidence={categories.transport.avg_confidence}
      >
        <TransportTable items={categories.transport.items} />
      </Section>

      <Section
        title="Avfall"
        icon={<Trash2 className="h-4 w-4 text-red-500" />}
        totalCo2={categories.waste.total_co2_kg}
        entryCount={categories.waste.entry_count}
        avgConfidence={categories.waste.avg_confidence}
      >
        <WasteTable items={categories.waste.items} />
      </Section>

      <Section
        title="Energi"
        icon={<Zap className="h-4 w-4 text-yellow-600" />}
        totalCo2={categories.energy.total_co2_kg}
        entryCount={categories.energy.entry_count}
        avgConfidence={categories.energy.avg_confidence}
      >
        <EnergyTable items={categories.energy.items} />
      </Section>

      {/* Grand total */}
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
