import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { MaterialLineItem } from '../types/report'
import type { Column } from './DataTable'
import DataTable from './DataTable'
import { fmt, sourceLabel, confidenceBadge } from '../utils'

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
    render: (i) => <span className="font-medium">{fmt(i.total_co2_kg)}</span>,
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
    header: 'Tillit',
    align: 'right',
    render: (i) => confidenceBadge(i.confidence_score),
  },
]

function SupplierGroup({
  supplier,
  items,
}: {
  supplier: string
  items: MaterialLineItem[]
}) {
  const [open, setOpen] = useState(false)
  const subtotal = items.reduce((s, i) => s + (i.total_co2_kg ?? 0), 0)
  const Chevron = open ? ChevronDown : ChevronRight

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-6 py-2 text-left text-xs cursor-pointer hover:bg-gray-50"
      >
        <Chevron className="h-3 w-3 text-gray-400" />
        <span className="font-medium text-gray-700">{supplier}</span>
        <span className="ml-auto text-gray-500">
          {items.length} linjer · {fmt(subtotal)} kg CO₂e
        </span>
      </button>
      {open && <DataTable items={items} columns={COLUMNS} emptyMessage="" />}
    </div>
  )
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

  const groups = new Map<string, MaterialLineItem[]>()
  for (const item of items) {
    const key = item.supplier_name ?? 'Ukjent leverandør'
    const list = groups.get(key)
    if (list) list.push(item)
    else groups.set(key, [item])
  }

  return (
    <div className="divide-y divide-gray-100">
      {[...groups.entries()].map(([supplier, group]) => (
        <SupplierGroup key={supplier} supplier={supplier} items={group} />
      ))}
    </div>
  )
}
