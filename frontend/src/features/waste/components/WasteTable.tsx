import { useDeferredLoading } from '@/shared/hooks/useDeferredLoading'
import { useProjectWaste } from '../hooks/useWaste'
import type { WasteGroup } from '../types/waste'

type Props = {
  projectId: number
}

function WasteGroupCard({ group }: { group: WasteGroup }) {
  const label =
    group.source_type === 'waste_report'
      ? (group.file_name ?? 'CSV-rapport')
      : 'Manuell registrering'

  return (
    <div className="rounded-2xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {group.uploaded_at && (
          <p className="text-xs text-gray-400">
            {new Date(group.uploaded_at).toLocaleDateString('nb-NO')}
          </p>
        )}
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">Type</th>
            <th className="py-2">Tonn</th>
            <th className="py-2">CO₂ (kg)</th>
          </tr>
        </thead>
        <tbody>
          {group.items.map((item) => (
            <tr key={item.id} className="border-b last:border-b-0">
              <td className="py-2">{item.waste_type}</td>
              <td className="py-2">{item.quantity_tons}</td>
              <td className="py-2">{item.total_co2_kg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
