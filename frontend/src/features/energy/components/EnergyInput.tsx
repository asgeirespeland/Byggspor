import { Zap, Loader2 } from 'lucide-react'
import InlineUndoBar from '@/shared/components/InlineUndoBar'
import { useDeferredLoading } from '@/shared/hooks/useDeferredLoading'
import {
  useEnergies,
  usePriceZones,
  useCalculateEnergy,
  useUpdateEnergy,
  useDeleteEnergy,
} from '../hooks/useEnergies'
import EnergyForm from './EnergyForm'
import EnergySummary from './EnergySummary'
import EnergyRow from './EnergyRow'

const MAX_VISIBLE_ROWS = 10
const ROW_HEIGHT_PX = 41

interface EnergyInputProps {
  projectId: number
}

export default function EnergyInput({ projectId }: EnergyInputProps) {
  const { data: entries, isLoading: entriesLoading } = useEnergies(projectId)
  const showEntriesLoading = useDeferredLoading(entriesLoading)
  const { data: zones } = usePriceZones()
  const calculateMutation = useCalculateEnergy(projectId)
  const updateMutation = useUpdateEnergy(projectId)
  const { deleteEnergy, pendingEnergyId, undoEnergyDelete } =
    useDeleteEnergy(projectId)

  const totalKwh = entries?.reduce((sum, e) => sum + (e.kwh_used ?? 0), 0) ?? 0
  const totalCo2 =
    entries?.reduce((sum, e) => sum + (e.total_co2_kg ?? 0), 0) ?? 0

  const needsScroll = (entries?.length ?? 0) > MAX_VISIBLE_ROWS

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Energiforbruk</h3>
        <p className="mt-0.5 text-sm text-gray-500">
          Registrer strømforbruk (kWh) for å beregne CO₂-utslipp.
          Utslippsfaktor: 11,9 g CO₂/kWh (NVE klimadeklarasjon 2024).
        </p>
      </div>

      <EnergyForm
        zones={zones}
        onSubmit={({ kwh, priceZone, recordedDate }) =>
          calculateMutation.mutate({
            project_id: projectId,
            kwh_used: kwh,
            ...(priceZone ? { price_zone: priceZone } : {}),
            ...(recordedDate ? { recorded_date: recordedDate } : {}),
          })
        }
        isPending={calculateMutation.isPending}
        error={calculateMutation.error}
      />

      {entries && entries.length > 0 && (
        <EnergySummary totalKwh={totalKwh} totalCo2={totalCo2} />
      )}

      {showEntriesLoading && (
        <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Laster…</span>
        </div>
      )}

      {entries && entries.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div
            className={needsScroll ? 'overflow-y-auto' : undefined}
            style={
              needsScroll
                ? { maxHeight: (MAX_VISIBLE_ROWS + 1) * ROW_HEIGHT_PX }
                : undefined
            }
          >
            <table className="w-full text-sm table-fixed">
              <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2.5 w-[20%]">kWh</th>
                  <th className="px-4 py-2.5 w-[20%]">Prisområde</th>
                  <th className="px-4 py-2.5 w-[20%]">CO₂ (kg)</th>
                  <th className="px-4 py-2.5 w-[25%]">Dato</th>
                  <th className="px-4 py-2.5 w-[15%]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry) => (
                  <EnergyRow
                    key={entry.id}
                    entry={entry}
                    zones={zones}
                    onUpdate={(data) =>
                      updateMutation.mutate({ energyId: entry.id, data })
                    }
                    onDelete={() => void deleteEnergy(entry.id)}
                    isUpdating={updateMutation.isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {needsScroll && (
            <div className="border-t border-gray-100 bg-gray-50 px-4 py-1.5 text-center text-xs text-gray-400">
              {entries.length} registreringer
            </div>
          )}
        </div>
      )}

      {pendingEnergyId != null && (
        <InlineUndoBar message="Energidata slettet" onUndo={undoEnergyDelete} />
      )}

      {entries &&
        entries.length === 0 &&
        !entriesLoading &&
        pendingEnergyId == null && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50">
              <Zap className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-sm text-gray-500">
              Ingen energiregistreringer ennå
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              Legg til strømforbruk i skjemaet over
            </p>
          </div>
        )}
    </div>
  )
}
