import type { MaterialLineItem } from '../types/report'
import type { Column } from './DataTable'
import DataTable from './DataTable'
import CollapsibleGroup from './CollapsibleGroup'
import { fmt, co2Label, sourceLabel, confidenceBadge } from '../utils'

const COLUMNS: Column<MaterialLineItem>[] = [
  { header: 'Produkt', render: (i) => i.product_name ?? '—' },
  {
    header: 'NOBB',
    render: (i) => <span className="font-mono">{i.nobb_number ?? '—'}</span>,
  },
  { header: 'Antall', align: 'right', render: (i) => fmt(i.quantity, 2) },
  { header: 'Enhet', render: (i) => i.unit ?? '—' },
  {
    header: 'GWP/enhet',
    align: 'right',
    render: (i) => fmt(i.gwp_per_unit, 4),
  },
  {
    header: 'CO₂ (kg)',
    align: 'right',
    render: (i) => co2Label(i.total_co2_kg),
  },
  {
    header: 'EPD',
    render: (i) =>
      i.has_epd ? (
        <span className="text-emerald-600" title={i.epd_id ?? undefined}>
          {i.epd_id ?? 'Ja'}
        </span>
      ) : (
        <span className="text-gray-300">Nei</span>
      ),
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

function sumCo2(items: MaterialLineItem[]) {
  return items.reduce((s, i) => s + (i.total_co2_kg ?? 0), 0)
}

export default function MaterialsSection({
  items,
}: {
  items: MaterialLineItem[]
}) {
  if (items.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-gray-400">
        Ingen materialer registrert.
      </p>
    )
  }

  const suppliers = groupBy(
    items,
    (i) => i.supplier_name ?? 'Ukjent leverandør',
  )

  return (
    <div className="divide-y divide-gray-100">
      {[...suppliers.entries()].map(([supplier, supplierItems]) => {
        const invoices = groupBy(
          supplierItems,
          (i) => i.invoice_number ?? 'Ukjent faktura',
        )
        const hasMultipleInvoices = invoices.size > 1

        return (
          <CollapsibleGroup
            key={supplier}
            label={supplier}
            itemCount={supplierItems.length}
            totalCo2={sumCo2(supplierItems)}
          >
            {hasMultipleInvoices ? (
              <div className="divide-y divide-gray-50">
                {[...invoices.entries()].map(([invoice, invoiceItems]) => (
                  <CollapsibleGroup
                    key={invoice}
                    label={`Faktura ${invoice}`}
                    itemCount={invoiceItems.length}
                    totalCo2={sumCo2(invoiceItems)}
                    indent={1}
                  >
                    <DataTable
                      items={invoiceItems}
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
