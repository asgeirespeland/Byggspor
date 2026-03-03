import type { InvoiceResponse } from '../types/invoice'

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
      <div className="flex gap-4 text-sm">
        <span className="rounded bg-gray-100 px-3 py-1 text-gray-700">
          {data.line_items.length} linjer
        </span>
        {data.line_items.some((i) => i.flagged) && (
          <span className="rounded bg-amber-100 px-3 py-1 text-amber-800">
            {data.line_items.filter((i) => i.flagged).length} mangler
            identifikator
          </span>
        )}
      </div>
    </div>
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
