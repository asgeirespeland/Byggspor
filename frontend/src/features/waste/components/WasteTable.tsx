import { useDeferredLoading } from '@/shared/hooks/useDeferredLoading'
import CollapsibleGroupCard from '@/shared/components/CollapsibleGroupCard'
import {
  GROUP_TH,
  GROUP_THEAD,
  GROUP_TBODY,
} from '@/shared/components/ParsePreviewShell'
import RowActions from '@/shared/components/RowActions'
import { useProjectWaste } from '../hooks/useWaste'
import type { WasteGroup } from '../types/waste'

type Props = {
  projectId: number
}

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
            <th className={GROUP_TH}>Type</th>
            <th className={`${GROUP_TH} text-right`}>Tonn</th>
            <th className={`${GROUP_TH} text-right`}>CO₂ (kg)</th>
            <th className={GROUP_TH} />
          </tr>
        </thead>
        <tbody className={GROUP_TBODY}>
          {group.items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-800">{item.waste_type}</td>
              <td className="px-4 py-2 text-right text-gray-800">
                {item.quantity_tons != null
                  ? item.quantity_tons.toLocaleString('nb-NO', {
                      maximumFractionDigits: 3,
                    })
                  : '—'}
              </td>
              <td className="px-4 py-2 text-right text-gray-800">
                {item.total_co2_kg != null
                  ? item.total_co2_kg.toLocaleString('nb-NO', {
                      maximumFractionDigits: 2,
                    })
                  : '—'}
              </td>
              <td className="px-4 py-2">
                <RowActions />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CollapsibleGroupCard>
  )
}

export default function WasteTable({ projectId }: Props) {
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
