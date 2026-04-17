import { useMemo } from 'react'
import CollapsibleGroupCard from '@/widgets/CollapsibleGroupCard'
import DataTable from '@/widgets/data-table/DataTable'
import InlineUndoBar from '@/widgets/data-table/InlineUndoBar'
import {
  useUpdateWasteItem,
  useDeleteWasteItem,
  useDeleteWasteReport,
} from '../hooks/useWaste'
import type { WasteGroup } from '../types'
import { wasteColumns, type WasteRow } from '../columns'

interface Props {
  group: WasteGroup
  projectId: number
}

export default function WasteGroupCard({ group, projectId }: Props) {
  const updateMutation = useUpdateWasteItem(projectId)
  const { deleteWasteItem, pendingWasteItemId, undoWasteItemDelete } =
    useDeleteWasteItem(projectId)
  const { deleteWasteReport } = useDeleteWasteReport(projectId)

  const rows: WasteRow[] = useMemo(
    () =>
      group.items.map((item) => ({
        name: item.waste_type,
        fraction_code: null,
        quantity: item.quantity,
        unit: item.unit,
        co2_kg: item.total_co2_kg,
        co2_source: null,
        flagged: false,
      })),
    [group.items],
  )

  const label =
    group.source_type === 'WASTE_REPORT'
      ? (group.file_name ?? 'Avfallsrapport')
      : 'Manuell registrering'

  const totalCo2 = group.items.reduce(
    (sum, item) => sum + (item.total_co2_kg ?? 0),
    0,
  )

  const totalQty = group.items.reduce(
    (sum, item) => sum + (item.quantity ?? 0),
    0,
  )

  return (
    <CollapsibleGroupCard
      title={label}
      summary={
        <>
          <span>{group.items.length} poster</span>
          {totalQty > 0 && (
            <span>
              {totalQty.toLocaleString('nb-NO', { maximumFractionDigits: 2 })}{' '}
              enheter
            </span>
          )}
          {totalCo2 > 0 && (
            <span>
              {totalCo2.toLocaleString('nb-NO', { maximumFractionDigits: 1 })}{' '}
              kg CO₂
            </span>
          )}
          {group.uploaded_at && (
            <span>
              {new Date(group.uploaded_at).toLocaleDateString('nb-NO')}
            </span>
          )}
        </>
      }
      onDelete={() => {
        if (group.source_id != null) {
          void deleteWasteReport(group.source_id)
        } else {
          group.items.forEach((item) => void deleteWasteItem(item.id))
        }
      }}
      isDeleting={false}
    >
      <DataTable
        columns={wasteColumns}
        rows={rows}
        rowKey={(_, i) => group.items[i].id}
        onSaveEdit={(_row, i, values) => {
          const item = group.items[i]
          updateMutation.mutate({
            itemId: item.id,
            data: {
              waste_type: values[0] || undefined,
              quantity: values[1] ? parseFloat(values[1]) : undefined,
              total_co2_kg: values[3] ? parseFloat(values[3]) : undefined,
            },
          })
        }}
        onDeleteRow={(_row, i) => void deleteWasteItem(group.items[i].id)}
        isSaving={(_row, i) =>
          updateMutation.isPending &&
          updateMutation.variables?.itemId === group.items[i].id
        }
      />
      {pendingWasteItemId != null && (
        <InlineUndoBar
          message="Avfallspost slettet"
          onUndo={undoWasteItemDelete}
        />
      )}
    </CollapsibleGroupCard>
  )
}
