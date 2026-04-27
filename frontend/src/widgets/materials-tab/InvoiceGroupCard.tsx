import { useMemo } from 'react'
import CollapsibleGroupCard from '@/widgets/CollapsibleGroupCard'
import { DataTable } from '@/widgets/data-table'
import { InlineUndoBar } from '@/widgets/data-table'
import type { ProjectInvoiceGroup } from '@/entities/materials'
import {
  useUpdateMaterial,
  useDeleteMaterial,
} from '@/features/edit-uploaded-data'
import { sumBy } from '@/shared/utils/collections'
import { materialColumns, type MaterialRow } from '@/entities/materials'

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
  const updateMutation = useUpdateMaterial(projectId)
  const { deleteMaterial, pendingMaterialId, undoMaterialDelete } =
    useDeleteMaterial(projectId)

  const rows: MaterialRow[] = useMemo(
    () =>
      group.items.map((item) => ({
        name: item.material_name,
        nobb_number: item.nobb_number,
        gtin: item.gtin,
        quantity: item.quantity,
        unit: item.unit,
        line_total: item.total_price,
        co2_kg: item.total_co2_kg,
        flagged: item.flagged,
        enriched: true,
        has_epd: item.has_epd,
        manual_override: item.manual_override,
      })),
    [group.items],
  )

  const totalCo2 = sumBy(group.items, (item) => item.total_co2_kg)

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
      <DataTable
        columns={materialColumns}
        rows={rows}
        rowKey={(_, i) => group.items[i].id}
        rowClassName={(row) =>
          row.manual_override
            ? 'bg-info-soft/50'
            : row.flagged
              ? 'bg-warning-soft/50'
              : 'hover:bg-gray-50'
        }
        onSaveEdit={(_row, i, values) => {
          const item = group.items[i]
          const co2 = parseFloat(values[4])
          if (isNaN(co2)) return
          updateMutation.mutate({ materialId: item.id, total_co2_kg: co2 })
        }}
        onDeleteRow={(_row, i) => void deleteMaterial(group.items[i].id)}
        isSaving={(_row, i) =>
          updateMutation.isPending &&
          updateMutation.variables?.materialId === group.items[i].id
        }
      />
      {pendingMaterialId != null && (
        <InlineUndoBar
          message="Materialpost slettet"
          onUndo={undoMaterialDelete}
        />
      )}
    </CollapsibleGroupCard>
  )
}
