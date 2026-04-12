import { Check, Loader2 } from 'lucide-react'
import CollapsibleGroupCard from '@/shared/components/CollapsibleGroupCard'
import {
  GROUP_TH,
  GROUP_THEAD,
  GROUP_TBODY,
} from '@/shared/components/ParsePreviewShell'
import RowActions from '@/shared/components/RowActions'
import { useInlineEdit } from '@/shared/hooks/useInlineEdit'
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
        <thead className={GROUP_THEAD}>
          <tr>
            <th className={GROUP_TH}>Materiale</th>
            <th className={GROUP_TH}>NOBB</th>
            <th className={`${GROUP_TH} text-right`}>Antall</th>
            <th className={`${GROUP_TH} text-right`}>CO₂ (kg)</th>
            <th className={GROUP_TH}>EPD</th>
            <th className={GROUP_TH} />
          </tr>
        </thead>
        <tbody className={GROUP_TBODY}>
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
  const { editing, value, setValue, startEdit, cancelEdit } = useInlineEdit('')
  const updateMutation = useUpdateMaterial(projectId)

  const handleSave = () => {
    const val = parseFloat(value)
    if (isNaN(val)) return
    updateMutation.mutate(
      { materialId: item.id, total_co2_kg: val },
      {
        onSuccess: () => {
          cancelEdit()
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
            : 'hover:bg-gray-50'
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
                if (e.key === 'Escape') cancelEdit()
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
              onClick={cancelEdit}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Avbryt
            </button>
          </div>
        ) : (
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
      <td className="px-4 py-2">
        <RowActions
          onEdit={() =>
            startEdit(
              item.total_co2_kg != null ? String(item.total_co2_kg) : '',
            )
          }
        />
      </td>
    </tr>
  )
}
