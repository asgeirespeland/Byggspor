/**
 * Energy tab composer.
 * Renders EnergyForm, EnergySummary, and an editable DataTable of entries
 * with optimistic delete + undo bar. Wires all energy hooks together.
 */
import { useMemo } from 'react'
import { Zap, Loader2 } from 'lucide-react'
import { InlineUndoBar } from '@/widgets/data-table'
import { DataTable } from '@/widgets/data-table'
import type { EditableColumn } from '@/shared/types/tableColumn'
import { useDeferredLoading } from '@/shared/hooks/useDeferredLoading'
import { sumBy } from '@/shared/utils/collections'
import { useEnergies, usePriceZones } from '@/entities/energy'
import { useCalculateEnergy } from '@/features/log-energy'
import { useUpdateEnergy, useDeleteEnergy } from '@/features/edit-uploaded-data'
import type { EnergyEntry, PriceZone } from '@/entities/energy'
import { EnergyForm } from '@/features/log-energy'
import EnergySummary from './EnergySummary'

const INPUT =
  'w-full rounded border border-gray-300 px-2 text-sm h-7 focus:outline-none focus:ring-1 focus:ring-gray-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

function getColumns(
  zones: { value: string; label: string }[] | undefined,
): EditableColumn<EnergyEntry>[] {
  return [
    {
      header: 'kWh',
      render: (e) => (
        <span className="font-medium text-gray-900">
          {e.kwh_used?.toLocaleString('nb-NO', { maximumFractionDigits: 1 })}
        </span>
      ),
      editable: {
        type: 'number',
        getValue: (e) => (e.kwh_used != null ? String(e.kwh_used) : ''),
      },
    },
    {
      header: 'Prisområde',
      render: (e) => (
        <span className="text-gray-600">{e.price_zone ?? '—'}</span>
      ),
      editable: {
        getValue: (e) => e.price_zone ?? '',
        render: (value, onChange) => (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={INPUT}
          >
            <option value="">—</option>
            {zones?.map((z) => (
              <option key={z.value} value={z.value}>
                {z.value}
              </option>
            ))}
          </select>
        ),
      },
    },
    {
      header: 'CO₂ (kg)',
      render: (e) => (
        <span className="text-gray-600">
          {e.total_co2_kg?.toLocaleString('nb-NO', {
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      header: 'Dato',
      render: (e) => (
        <span className="text-gray-500">
          {e.recorded_date
            ? new Date(e.recorded_date + 'T00:00:00').toLocaleDateString(
                'nb-NO',
              )
            : '—'}
        </span>
      ),
      editable: {
        type: 'date',
        getValue: (e) => e.recorded_date ?? '',
      },
    },
  ]
}

const MAX_VISIBLE_ROWS = 10
const ROW_HEIGHT_PX = 44

interface EnergyTabProps {
  projectId: number
}

export default function EnergyTab({ projectId }: EnergyTabProps) {
  const { data: entries, isLoading: entriesLoading } = useEnergies(projectId)
  const showEntriesLoading = useDeferredLoading(entriesLoading)
  const { data: zones } = usePriceZones()
  const calculateMutation = useCalculateEnergy(projectId)
  const updateMutation = useUpdateEnergy(projectId)
  const { deleteEnergy, pendingEnergyId, undoEnergyDelete } =
    useDeleteEnergy(projectId)

  const columns = useMemo(() => getColumns(zones), [zones])

  const totalKwh = sumBy(entries ?? [], (e) => e.kwh_used)
  const totalCo2 = sumBy(entries ?? [], (e) => e.total_co2_kg)

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
            <DataTable
              columns={columns}
              rows={entries}
              rowKey={(e) => e.id}
              onSaveEdit={(row, _i, values) => {
                const kwh = parseFloat(values[0])
                if (isNaN(kwh) || kwh < 0) return
                updateMutation.mutate({
                  energyId: row.id,
                  data: {
                    kwh_used: kwh,
                    price_zone: (values[1] as PriceZone) || null,
                    recorded_date: values[3] || null,
                  },
                })
              }}
              onDeleteRow={(row) => void deleteEnergy(row.id)}
              isSaving={() => updateMutation.isPending}
              stickyHeader
            />
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
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-energy-soft">
              <Zap className="h-5 w-5 text-energy" />
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
