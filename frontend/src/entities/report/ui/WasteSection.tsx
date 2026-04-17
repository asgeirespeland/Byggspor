import type { WasteLineItem } from '@/entities/report/types'
import type { Column } from './ReportDataTable'
import DataTable from './ReportDataTable'
import CollapsibleGroup from './CollapsibleGroup'
import { fmt, sourceLabel, confidenceBadge } from '@/entities/report/utils'

const COLUMNS: Column<WasteLineItem>[] = [
  { header: 'Avfallstype', render: (i) => i.waste_type ?? '—' },
  {
    header: 'Antall',
    align: 'right',
    render: (i) => `${fmt(i.quantity, 3)} ${i.unit ?? ''}`.trim(),
  },
  {
    header: 'CO₂ (kg)',
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

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const k = key(item)
    const list = map.get(k)
    if (list) list.push(item)
    else map.set(k, [item])
  }
  return map
}

function sumCo2(items: WasteLineItem[]) {
  return items.reduce((s, i) => s + (i.total_co2_kg ?? 0), 0)
}

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
          <CollapsibleGroup
            key={supplier}
            label={supplier}
            itemCount={supplierItems.length}
            totalCo2={sumCo2(supplierItems)}
          >
            {hasMultipleSources ? (
              <div className="divide-y divide-gray-50">
                {[...sources.entries()].map(([source, sourceItems]) => (
                  <CollapsibleGroup
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
                  </CollapsibleGroup>
                ))}
              </div>
            ) : (
              <DataTable
                items={supplierItems}
                columns={COLUMNS}
                emptyMessage=""
              />
            )}
          </CollapsibleGroup>
        )
      })}
    </div>
  )
}
