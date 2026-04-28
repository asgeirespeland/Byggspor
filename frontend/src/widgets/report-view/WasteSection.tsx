import type { WasteLineItem } from '@/entities/report'
import type { DisplayColumn as Column } from '@/shared/types/tableColumn'
import DataTable from './ReportDataTable'
import ReportGroupRow from './ReportGroupRow'
import { fmt, sourceLabel, confidenceBadge } from '@/entities/report'
import { groupBy, sumBy } from '@/shared/utils/collections'

const COLUMNS: Column<WasteLineItem>[] = [
  { header: 'Avfallstype', render: (i) => i.waste_type ?? '—' },
  {
    header: 'Antall',
    align: 'right',
    render: (i) => `${fmt(i.quantity, 3)} ${i.unit ?? ''}`.trim(),
  },
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

const sumCo2 = (items: WasteLineItem[]) => sumBy(items, (i) => i.total_co2_kg)

export default function WasteSection({ items }: { items: WasteLineItem[] }) {
  if (items.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-gray-400">
        Ingen avfall registrert.
      </p>
    )
  }

  const suppliers = groupBy(
    items,
    (i) =>
      i.supplier_name ??
      (i.source_type === 'manual' ? 'Manuell registrering' : 'Ukjent kilde'),
  )

  return (
    <div className="divide-y divide-gray-100">
      {[...suppliers.entries()].map(([supplier, supplierItems]) => {
        const sources = groupBy(
          supplierItems,
          (i) => i.source_name ?? String(i.source_id ?? 'unknown'),
        )
        const hasMultipleSources = sources.size > 1

        return (
          <ReportGroupRow
            key={supplier}
            label={supplier}
            itemCount={supplierItems.length}
            totalCo2={sumCo2(supplierItems)}
          >
            {hasMultipleSources ? (
              <div className="divide-y divide-gray-50">
                {[...sources.entries()].map(([source, sourceItems]) => (
                  <ReportGroupRow
                    key={source}
                    label={source}
                    itemCount={sourceItems.length}
                    totalCo2={sumCo2(sourceItems)}
                    indent={1}
                  >
                    <DataTable
                      items={sourceItems}
                      columns={COLUMNS}
                      emptyMessage=""
                    />
                  </ReportGroupRow>
                ))}
              </div>
            ) : (
              <DataTable
                items={supplierItems}
                columns={COLUMNS}
                emptyMessage=""
              />
            )}
          </ReportGroupRow>
        )
      })}
    </div>
  )
}
