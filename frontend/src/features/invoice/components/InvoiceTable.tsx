import type { InvoiceResponse } from '../types/invoice'
import Co2Value from './Co2Value'
import EpdBadge from './EpdBadge'
import InvoiceTotalCo2 from './InvoiceTotalCo2'

export default function InvoiceTable({ data }: { data: InvoiceResponse }) {
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
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Navn
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                GTIN
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                NOBB
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                Antall
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Enhet
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                Pris
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                Sum
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                CO₂ (kg)
                <sup className="group relative ml-0.5 cursor-help text-gray-300">
                  ?
                  <span className="pointer-events-none absolute top-full right-0 z-10 mt-2 hidden w-56 rounded bg-gray-900 px-3 py-2 text-xs font-normal text-gray-100 shadow-lg group-hover:block">
                    GWP A1-A3 (produksjonsfase). Avfall (C1-C4) rapporteres
                    separat.
                  </span>
                </sup>
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                EPD
              </th>
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
        <InvoiceTotalCo2 items={data.line_items} />
      </div>
    </div>
  )
}
