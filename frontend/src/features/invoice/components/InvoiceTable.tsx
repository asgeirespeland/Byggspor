import type { InvoiceResponse, LineItem } from '../types/invoice'

interface InvoiceTableProps {
  data: InvoiceResponse
}

export default function InvoiceTable({ data }: InvoiceTableProps) {
  return (
    <div className="mt-6 space-y-4">
      {/* Invoice metadata */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
        {data.invoice_number && (
          <span>
            <span className="font-medium text-gray-800">Faktura:</span>{' '}
            {data.invoice_number}
          </span>
        )}
        {data.issue_date && (
          <span>
            <span className="font-medium text-gray-800">Dato:</span>{' '}
            {data.issue_date}
          </span>
        )}
        {data.supplier?.name && (
          <span>
            <span className="font-medium text-gray-800">Leverandør:</span>{' '}
            {data.supplier.name}
          </span>
        )}
      </div>

      {/* Line items table */}
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#30466e] text-white">
            <tr>
              <th className="px-4 py-3 font-medium">Navn</th>
              <th className="px-4 py-3 font-medium">GTIN</th>
              <th className="px-4 py-3 font-medium">NOBB</th>
              <th className="px-4 py-3 font-medium text-right">Antall</th>
              <th className="px-4 py-3 font-medium">Enhet</th>
              <th className="px-4 py-3 font-medium text-right">Pris</th>
              <th className="px-4 py-3 font-medium text-right">Sum</th>
              <th className="px-4 py-3 font-medium text-right">
                CO₂ (kg)
                <sup className="group relative ml-0.5 cursor-help text-white/60">
                  ?
                  <span className="pointer-events-none absolute top-full right-0 mt-2 z-10 hidden w-56 rounded bg-gray-900 px-3 py-2 text-xs font-normal text-gray-100 shadow-lg group-hover:block">
                    GWP A1-A3 (produksjonsfase). Avfall (C1-C4) rapporteres
                    separat.
                  </span>
                </sup>
              </th>
              <th className="px-4 py-3 font-medium">EPD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.line_items.map((item, i) => (
              <tr
                key={item.line_number ?? i}
                className={item.flagged ? 'bg-amber-50' : 'bg-white'}
              >
                <td className="px-4 py-3 text-gray-800">
                  {item.name ?? '—'}
                  {item.flagged && (
                    <span className="ml-2 inline-block rounded bg-amber-200 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                      Mangler ID
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                  {item.gtin ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                  {item.nobb_number ?? '—'}
                </td>
                <td className="px-4 py-3 text-right text-gray-800">
                  {item.quantity ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">{item.unit ?? '—'}</td>
                <td className="px-4 py-3 text-right text-gray-800">
                  {item.price_per_unit != null
                    ? item.price_per_unit.toFixed(2)
                    : '—'}
                </td>
                <td className="px-4 py-3 text-right text-gray-800">
                  {item.line_total != null ? item.line_total.toFixed(2) : '—'}
                </td>
                <td className="px-4 py-3 text-right text-gray-800">
                  <Co2Value item={item} />
                </td>
                <td className="px-4 py-3">
                  <EpdBadge
                    enriched={item.enriched}
                    hasEpd={item.nobb_data?.has_epd ?? false}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="rounded bg-gray-100 px-3 py-1 text-gray-700">
          {data.line_items.length} linjer
        </span>
        {data.line_items.some((i) => i.flagged) && (
          <span className="rounded bg-amber-100 px-3 py-1 text-amber-800">
            {data.line_items.filter((i) => i.flagged).length} mangler
            identifikator
          </span>
        )}
        <TotalCo2 items={data.line_items} />
      </div>
    </div>
  )
}

function getGwpA1A3(item: LineItem): number | null {
  const stages = item.nobb_data?.epd?.gwp_stages
  if (!stages) return null
  const a1a3 = stages['a1_a3'] ?? stages['A1-A3']
  return a1a3?.total ?? null
}

function Co2Value({ item }: { item: LineItem }) {
  const gwp = getGwpA1A3(item)
  if (gwp == null) return <span className="text-gray-400">—</span>

  const qty = item.quantity ?? 1
  const total = gwp * qty
  return (
    <span title={`${gwp.toFixed(4)} kg CO₂e/enhet × ${qty}`}>
      {total.toFixed(2)}
    </span>
  )
}

function TotalCo2({ items }: { items: LineItem[] }) {
  let total = 0
  let count = 0
  for (const item of items) {
    const gwp = getGwpA1A3(item)
    if (gwp != null) {
      total += gwp * (item.quantity ?? 1)
      count++
    }
  }
  if (count === 0) return null
  return (
    <span className="rounded bg-green-100 px-3 py-1 text-green-800">
      CO₂: {total.toFixed(2)} kg ({count}/{items.length} linjer)
    </span>
  )
}

function EpdBadge({
  enriched,
  hasEpd,
}: {
  enriched: boolean
  hasEpd: boolean
}) {
  if (!enriched) {
    return (
      <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-600">
        Ikke søkbar
      </span>
    )
  }

  if (hasEpd) {
    return (
      <span className="inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        EPD
      </span>
    )
  }

  return (
    <span className="inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
      Ingen EPD
    </span>
  )
}
