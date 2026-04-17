import type { MaterialLineItem } from '@/entities/report/types'
import type { Column } from './ReportDataTable'
import DataTable from './ReportDataTable'
import ReportGroupRow from './ReportGroupRow'
import {
  fmt,
  co2Label,
  sourceLabel,
  confidenceBadge,
} from '@/entities/report/utils'
import { groupBy, sumBy } from '@/shared/utils/collections'

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
        <span className="text-success-strong" title={i.epd_id ?? undefined}>
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

const sumCo2 = (items: MaterialLineItem[]) =>
  sumBy(items, (i) => i.total_co2_kg)

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
          <ReportGroupRow
            key={supplier}
            label={supplier}
            itemCount={supplierItems.length}
            totalCo2={sumCo2(supplierItems)}
          >
            {hasMultipleInvoices ? (
              <div className="divide-y divide-gray-50">
                {[...invoices.entries()].map(([invoice, invoiceItems]) => (
                  <ReportGroupRow
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
