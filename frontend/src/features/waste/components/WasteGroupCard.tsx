import { useDeferredLoading } from '@/shared/hooks/useDeferredLoading'
import CollapsibleGroupCard from '@/shared/components/CollapsibleGroupCard'
import {
  GROUP_TH,
  GROUP_THEAD,
  GROUP_TBODY,
} from '@/shared/components/ParsePreviewShell'
import EditableRow, { type GroupColumn } from '@/shared/components/EditableRow'
import InlineUndoBar from '@/shared/components/InlineUndoBar'
import {
  useProjectWaste,
  useUpdateWasteItem,
  useDeleteWasteItem,
  useDeleteWasteReport,
} from '../hooks/useWaste'
import type { WasteGroup, WasteItem } from '../types/waste'

type Props = {
  projectId: number
}

const INPUT = 'w-full rounded border border-gray-300 px-2 py-1 text-sm'

const columns: GroupColumn<WasteItem>[] = [
  {
    header: 'Type',
    render: (item) => <span className="text-gray-800">{item.waste_type}</span>,
    editRender: (value, onChange) => (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT}
        autoFocus
      />
    ),
  },
  {
    header: 'Tonn',
    align: 'right',
    render: (item) => (
      <span className="text-gray-800">
        {item.quantity_tons != null
          ? item.quantity_tons.toLocaleString('nb-NO', {
              maximumFractionDigits: 3,
            })
          : '—'}
      </span>
    ),
    editRender: (value, onChange) => (
      <input
        type="number"
        min="0"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT} w-24 text-right`}
      />
    ),
  },
  {
    header: 'CO₂ (kg)',
    align: 'right',
    render: (item) => (
      <span className="text-gray-800">
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
        min="0"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT} w-24 text-right`}
      />
    ),
  },
]

function WasteCard({
  group,
  projectId,
}: {
  group: WasteGroup
  projectId: number
}) {
  const updateMutation = useUpdateWasteItem(projectId)
  const { deleteWasteItem, pendingWasteItemId, undoWasteItemDelete } =
    useDeleteWasteItem(projectId)
  const { deleteWasteReport } = useDeleteWasteReport(projectId)

  const label =
    group.source_type === 'WASTE_REPORT'
      ? (group.file_name ?? 'Avfallsrapport')
      : 'Manuell registrering'

  const totalCo2 = group.items.reduce(
    (sum, item) => sum + (item.total_co2_kg ?? 0),
    0,
  )

  const totalTons = group.items.reduce(
    (sum, item) => sum + (item.quantity_tons ?? 0),
    0,
  )

  return (
    <CollapsibleGroupCard
      title={label}
      summary={
        <>
          <span>{group.items.length} poster</span>
          {totalTons > 0 && (
            <span>
              {totalTons.toLocaleString('nb-NO', { maximumFractionDigits: 2 })}{' '}
              tonn
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
      <table className="w-full text-sm">
        <thead className={GROUP_THEAD}>
          <tr>
            <th className={GROUP_TH}>Type</th>
            <th className={`${GROUP_TH} text-right`}>Tonn</th>
            <th className={`${GROUP_TH} text-right`}>CO₂ (kg)</th>
            <th className={GROUP_TH} />
          </tr>
        </thead>
        <tbody className={GROUP_TBODY}>
          {group.items.map((item) => (
            <EditableRow
              key={item.id}
              row={item}
              columns={columns}
              getEditValues={(it) => ({
                0: it.waste_type ?? '',
                1: it.quantity_tons != null ? String(it.quantity_tons) : '',
                2: it.total_co2_kg != null ? String(it.total_co2_kg) : '',
              })}
              onSave={(values) => {
                updateMutation.mutate({
                  itemId: item.id,
                  data: {
                    waste_type: values[0] || undefined,
                    quantity_tons: values[1]
                      ? parseFloat(values[1])
                      : undefined,
                    total_co2_kg: values[2] ? parseFloat(values[2]) : undefined,
                  },
                })
              }}
              onDelete={() => void deleteWasteItem(item.id)}
              isSaving={
                updateMutation.isPending &&
                updateMutation.variables?.itemId === item.id
              }
            />
          ))}
        </tbody>
      </table>
      {pendingWasteItemId != null && (
        <InlineUndoBar
          message="Avfallspost slettet"
          onUndo={undoWasteItemDelete}
        />
      )}
    </CollapsibleGroupCard>
  )
}

export default function WasteList({ projectId }: Props) {
  const wasteQuery = useProjectWaste(projectId)
  const showLoading = useDeferredLoading(wasteQuery.isLoading)
  const { pendingWasteReportId, undoWasteReportDelete } =
    useDeleteWasteReport(projectId)

  return (
    <div className="space-y-3">
      {showLoading && (
        <p className="py-4 text-center text-sm text-gray-400">
          Laster avfallsdata…
        </p>
      )}

      {wasteQuery.isError && (
        <p className="text-sm text-red-600">Kunne ikke hente avfallsdata.</p>
      )}

      {wasteQuery.data && wasteQuery.data.length > 0 && (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Registrert avfall ({wasteQuery.data.length})
          </p>
          {wasteQuery.data.map((group) => (
            <WasteCard
              key={group.source_id ?? 'manual'}
              group={group}
              projectId={projectId}
            />
          ))}
        </>
      )}

      {pendingWasteReportId != null && (
        <InlineUndoBar
          message="Avfallsrapport slettet"
          onUndo={undoWasteReportDelete}
        />
      )}
    </div>
  )
}
