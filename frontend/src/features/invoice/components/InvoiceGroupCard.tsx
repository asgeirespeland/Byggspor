import CollapsibleGroupCard from '@/shared/components/CollapsibleGroupCard'
import type { ProjectInvoiceGroup } from '../api/invoice'

interface Props {
  group: ProjectInvoiceGroup
  onDelete: () => void
  isDeleting: boolean
}

export default function InvoiceGroupCard({
  group,
  onDelete,
  isDeleting,
}: Props) {
  const totalCo2 = group.items.reduce(
    (sum, item) => sum + (item.total_co2_kg ?? 0),
    0,
  )

  return (
    <CollapsibleGroupCard
      title={
        <>
          {group.supplier_name ?? 'Ukjent leverandør'}
          {group.invoice_number && (
            <span className="ml-2 text-gray-400 font-normal">
              #{group.invoice_number}
            </span>
          )}
        </>
      }
      summary={
        <>
          <span>{group.items.length} linjer</span>
          {totalCo2 > 0 && (
            <span>
              {totalCo2.toLocaleString('nb-NO', { maximumFractionDigits: 1 })}{' '}
              kg CO₂
            </span>
          )}
          {group.invoice_date && <span>{group.invoice_date}</span>}
        </>
      }
      onDelete={onDelete}
      isDeleting={isDeleting}
    >
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
          <tr>
            <th className="px-4 py-2">Materiale</th>
            <th className="px-4 py-2">NOBB</th>
            <th className="px-4 py-2 text-right">Antall</th>
            <th className="px-4 py-2 text-right">CO₂ (kg)</th>
            <th className="px-4 py-2">EPD</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {group.items.map((item) => (
            <tr key={item.id} className={item.flagged ? 'bg-amber-50/50' : ''}>
              <td className="px-4 py-2 text-gray-800 truncate max-w-48">
                {item.material_name ?? '—'}
              </td>
              <td className="px-4 py-2 text-gray-500 font-mono text-xs">
                {item.nobb_number ?? '—'}
              </td>
              <td className="px-4 py-2 text-right text-gray-800">
                {item.quantity ?? '—'} {item.unit ?? ''}
              </td>
              <td className="px-4 py-2 text-right text-gray-800">
                {item.total_co2_kg != null
                  ? item.total_co2_kg.toLocaleString('nb-NO', {
                      maximumFractionDigits: 2,
                    })
                  : '—'}
              </td>
              <td className="px-4 py-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    item.has_epd
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {item.has_epd ? 'Ja' : 'Nei'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CollapsibleGroupCard>
  )
}
