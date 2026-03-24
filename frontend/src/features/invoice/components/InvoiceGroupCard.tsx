import { useState } from 'react'
import { Check, Loader2, Pencil } from 'lucide-react'
import CollapsibleGroupCard from '@/shared/components/CollapsibleGroupCard'
import type { ProjectInvoiceGroup, ProjectMaterialItem } from '../api/invoice'
import { useUpdateMaterial } from '../hooks/useProjectMaterials'

interface Props {
  group: ProjectInvoiceGroup
  projectId: number
  onDelete: () => void
  isDeleting: boolean
}

export default function InvoiceGroupCard({
  group,
  projectId,
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
            <MaterialRow key={item.id} item={item} projectId={projectId} />
          ))}
        </tbody>
      </table>
    </CollapsibleGroupCard>
  )
}

function MaterialRow({
  item,
  projectId,
}: {
  item: ProjectMaterialItem
  projectId: number
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const updateMutation = useUpdateMaterial(projectId)

  const handleSave = () => {
    const val = parseFloat(value)
    if (isNaN(val)) return
    updateMutation.mutate(
      { materialId: item.id, total_co2_kg: val },
      {
        onSuccess: () => {
          setEditing(false)
          setValue('')
        },
      },
    )
  }

  return (
    <tr
      className={
        item.manual_override
          ? 'bg-blue-50/50'
          : item.flagged
            ? 'bg-amber-50/50'
            : ''
      }
    >
      <td className="px-4 py-2 text-gray-800 truncate max-w-48">
        {item.material_name ?? '—'}
        {item.manual_override && (
          <span className="ml-2 inline-block rounded bg-blue-200 px-1.5 py-0.5 text-xs font-medium text-blue-800">
            Korrigert
          </span>
        )}
      </td>
      <td className="px-4 py-2 text-gray-500 font-mono text-xs">
        {item.nobb_number ?? '—'}
      </td>
      <td className="px-4 py-2 text-right text-gray-800">
        {item.quantity ?? '—'} {item.unit ?? ''}
      </td>
      <td className="px-4 py-2 text-right">
        {editing ? (
          <div className="flex items-center justify-end gap-1">
            <input
              type="number"
              step="any"
              placeholder="kg CO₂"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') setEditing(false)
              }}
              className="h-7 w-20 rounded border border-gray-900 bg-white px-2 text-xs text-right focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending || !value}
              className="flex h-6 w-6 items-center justify-center rounded bg-gray-900 text-white hover:bg-black disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Avbryt
            </button>
          </div>
        ) : (
          <span className="group inline-flex items-center justify-end gap-1">
            <span
              className={
                item.total_co2_kg == null ? 'text-gray-400' : 'text-gray-800'
              }
            >
              {item.total_co2_kg != null
                ? item.total_co2_kg.toLocaleString('nb-NO', {
                    maximumFractionDigits: 2,
                  })
                : '—'}
            </span>
            <button
              onClick={() => {
                setValue(
                  item.total_co2_kg != null ? String(item.total_co2_kg) : '',
                )
                setEditing(true)
              }}
              className="invisible text-gray-300 hover:text-gray-600 group-hover:visible"
              title="Korriger CO₂-verdi"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </span>
        )}
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
  )
}
