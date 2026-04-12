import CollapsibleGroupCard from '@/shared/components/CollapsibleGroupCard'
import {
  GROUP_TH,
  GROUP_THEAD,
  GROUP_TBODY,
} from '@/shared/components/ParsePreviewShell'
import EditableRow, { type GroupColumn } from '@/shared/components/EditableRow'
import type { ProjectInvoiceGroup, ProjectMaterialItem } from '../api/invoice'
import {
  useUpdateMaterial,
  useDeleteMaterial,
} from '../hooks/useProjectMaterials'
import InlineUndoBar from '@/shared/components/InlineUndoBar'

interface Props {
  group: ProjectInvoiceGroup
  projectId: number
  onDelete: () => void
  isDeleting: boolean
}

const INPUT = 'w-full rounded border border-gray-300 px-2 py-1 text-sm'

const columns: GroupColumn<ProjectMaterialItem>[] = [
  {
    header: 'Materiale',
    render: (item) => (
      <span className="text-gray-800 truncate max-w-48 block">
        {item.material_name ?? '—'}
        {item.manual_override && (
          <span className="ml-2 inline-block rounded bg-blue-200 px-1.5 py-0.5 text-xs font-medium text-blue-800">
            Korrigert
          </span>
        )}
      </span>
    ),
  },
  {
    header: 'NOBB',
    render: (item) => (
      <span className="text-gray-500 font-mono text-xs">
        {item.nobb_number ?? '—'}
      </span>
    ),
  },
  {
    header: 'Antall',
    align: 'right',
    render: (item) => (
      <span className="text-gray-800">
        {item.quantity ?? '—'} {item.unit ?? ''}
      </span>
    ),
  },
  {
    header: 'CO₂ (kg)',
    align: 'right',
    render: (item) => (
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
    ),
    editRender: (value, onChange) => (
      <input
        type="number"
        step="any"
        placeholder="kg CO₂"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT} w-24 text-right`}
        autoFocus
      />
    ),
  },
  {
    header: 'EPD',
    render: (item) => (
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
          item.has_epd
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-gray-100 text-gray-500'
        }`}
      >
        {item.has_epd ? 'Ja' : 'Nei'}
      </span>
    ),
  },
]

export default function InvoiceGroupCard({
  group,
  projectId,
  onDelete,
  isDeleting,
}: Props) {
  const updateMutation = useUpdateMaterial(projectId)
  const { deleteMaterial, pendingMaterialId, undoMaterialDelete } =
    useDeleteMaterial(projectId)
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
            {columns.map((col, i) => (
              <th
                key={i}
                className={
                  col.align === 'right' ? `${GROUP_TH} text-right` : GROUP_TH
                }
              >
                {col.header}
              </th>
            ))}
            <th className={GROUP_TH} />
          </tr>
        </thead>
        <tbody className={GROUP_TBODY}>
          {group.items.map((item) => (
            <EditableRow
              key={item.id}
              row={item}
              columns={columns}
              rowClassName={
                item.manual_override
                  ? 'bg-blue-50/50'
                  : item.flagged
                    ? 'bg-amber-50/50'
                    : 'hover:bg-gray-50'
              }
              getEditValues={(it) => ({
                3: it.total_co2_kg != null ? String(it.total_co2_kg) : '',
              })}
              onSave={(values) => {
                const val = parseFloat(values[3])
                if (isNaN(val)) return
                updateMutation.mutate({
                  materialId: item.id,
                  total_co2_kg: val,
                })
              }}
              onDelete={() => void deleteMaterial(item.id)}
              isSaving={
                updateMutation.isPending &&
                updateMutation.variables?.materialId === item.id
              }
            />
          ))}
        </tbody>
      </table>
      {pendingMaterialId != null && (
        <InlineUndoBar
          message="Materialpost slettet"
          onUndo={undoMaterialDelete}
        />
      )}
    </CollapsibleGroupCard>
  )
}
