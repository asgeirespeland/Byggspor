import { useDeferredLoading } from '@/shared/hooks/useDeferredLoading'
import CollapsibleGroupCard from '@/shared/components/CollapsibleGroupCard'
import {
  GROUP_TH,
  GROUP_THEAD,
  GROUP_TBODY,
} from '@/shared/components/ParsePreviewShell'
import EditableRow, { type GroupColumn } from '@/shared/components/EditableRow'
import { useProjectWaste } from '../hooks/useWaste'
import type { WasteGroup, WasteItem } from '../types/waste'

type Props = {
  projectId: number
}

const columns: GroupColumn<WasteItem>[] = [
  {
    header: 'Type',
    render: (item) => <span className="text-gray-800">{item.waste_type}</span>,
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
  },
]

function WasteGroupCard({ group }: { group: WasteGroup }) {
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
        // TODO: wire up delete endpoint
      }}
      isDeleting={false}
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
              getEditValues={() => ({})}
              onSave={() => {
                // TODO: wire up update endpoint
              }}
            />
          ))}
        </tbody>
      </table>
    </CollapsibleGroupCard>
  )
}

export default function WasteList({ projectId }: Props) {
  const wasteQuery = useProjectWaste(projectId)
  const showLoading = useDeferredLoading(wasteQuery.isLoading)

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
            <WasteGroupCard key={group.source_id ?? 'manual'} group={group} />
          ))}
        </>
      )}
    </div>
  )
}
