import type { TransportLineItem } from '@/entities/report'
import type { DisplayColumn as Column } from '@/shared/types/tableColumn'
import DataTable from './ReportDataTable'
import ReportGroupRow from './ReportGroupRow'
import { fmt, sourceLabel, confidenceBadge } from '@/entities/report'
import { groupBy, sumBy } from '@/shared/utils/collections'

const COLUMNS: Column<TransportLineItem>[] = [
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
    header: 'CO₂e (kg)',
    align: 'right',
    render: (i) => <span className="font-medium">{fmt(i.total_co2_kg)}</span>,
  },
  { header: 'Kilde', render: (i) => sourceLabel(i.source_type) },
  {
    header: 'Konfidens',
    align: 'right',
    render: (i) => confidenceBadge(i.confidence_score),
  },
]

const sumCo2 = (items: TransportLineItem[]) =>
  sumBy(items, (i) => i.total_co2_kg)

export default function TransportSection({
  items,
}: {
  items: TransportLineItem[]
}) {
  if (items.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-gray-400">
        Ingen transport registrert.
      </p>
    )
  }

  const sources = groupBy(
    items,
    (i) =>
      i.source_name ??
      (i.source_type === 'manual' ? 'Manuell' : 'Ukjent kilde'),
  )

  if (sources.size === 1) {
    return <DataTable items={items} columns={COLUMNS} emptyMessage="" />
  }

  return (
    <div className="divide-y divide-gray-100">
      {[...sources.entries()].map(([source, sourceItems]) => (
        <ReportGroupRow
          key={source}
          label={source}
          itemCount={sourceItems.length}
          totalCo2={sumCo2(sourceItems)}
        >
          <DataTable items={sourceItems} columns={COLUMNS} emptyMessage="" />
        </ReportGroupRow>
      ))}
    </div>
  )
}
