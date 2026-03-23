import { useState } from 'react'
import { Zap, Trash2, Loader2, Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDeferredLoading } from '@/shared/hooks/useDeferredLoading'
import {
  useEnergies,
  usePriceZones,
  useCalculateEnergy,
  useUpdateEnergy,
  useDeleteEnergy,
} from '../hooks/useEnergies'
import type { EnergyEntry, EnergyUpdateInput, PriceZone } from '../types/energy'

const MAX_VISIBLE_ROWS = 10
const ROW_HEIGHT_PX = 41 // matches py-2.5 + text

interface EnergyInputProps {
  projectId: number
}

export default function EnergyInput({ projectId }: EnergyInputProps) {
  const [kwhUsed, setKwhUsed] = useState('')
  const [priceZone, setPriceZone] = useState<PriceZone | ''>('')
  const [recordedDate, setRecordedDate] = useState(
    () => new Date().toISOString().split('T')[0],
  )

  const { data: entries, isLoading: entriesLoading } = useEnergies(projectId)
  const showEntriesLoading = useDeferredLoading(entriesLoading)
  const { data: zones } = usePriceZones()
  const calculateMutation = useCalculateEnergy(projectId)
  const updateMutation = useUpdateEnergy(projectId)
  const deleteEnergy = useDeleteEnergy(projectId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const kwh = parseFloat(kwhUsed)
    if (isNaN(kwh) || kwh < 0) return

    calculateMutation.mutate(
      {
        project_id: projectId,
        kwh_used: kwh,
        ...(priceZone ? { price_zone: priceZone } : {}),
        ...(recordedDate ? { recorded_date: recordedDate } : {}),
      },
      {
        onSuccess: () => {
          setKwhUsed('')
        },
      },
    )
  }

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

      {/* Input form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="kwh">Strømforbruk (kWh)</Label>
            <Input
              id="kwh"
              type="number"
              min="0"
              step="any"
              placeholder="f.eks. 15000"
              value={kwhUsed}
              onChange={(e) => setKwhUsed(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zone">Prisområde (valgfritt)</Label>
            <select
              id="zone"
              value={priceZone}
              onChange={(e) => setPriceZone(e.target.value as PriceZone | '')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Velg prisområde…</option>
              {zones?.map((z) => (
                <option key={z.value} value={z.value}>
                  {z.value} — {z.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date">Dato (valgfritt)</Label>
            <Input
              id="date"
              type="date"
              value={recordedDate}
              onChange={(e) => setRecordedDate(e.target.value)}
            />
          </div>
        </div>

        {calculateMutation.error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {calculateMutation.error instanceof Error
              ? calculateMutation.error.message
              : 'Noe gikk galt'}
          </p>
        )}

        <Button
          type="submit"
          size="sm"
          disabled={!kwhUsed || calculateMutation.isPending}
        >
          {calculateMutation.isPending ? 'Beregner…' : 'Beregn CO₂'}
        </Button>
      </form>

      {/* Summary */}
      {entries && entries.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
            <p className="text-xs font-medium text-yellow-700">
              Totalt forbruk
            </p>
            <p className="mt-0.5 text-lg font-semibold text-yellow-900">
              {totalKwh.toLocaleString('nb-NO', { maximumFractionDigits: 1 })}{' '}
              kWh
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-medium text-emerald-700">Totalt CO₂</p>
            <p className="mt-0.5 text-lg font-semibold text-emerald-900">
              {totalCo2.toLocaleString('nb-NO', { maximumFractionDigits: 2 })}{' '}
              kg
            </p>
          </div>
        </div>
      )}

      {/* Entries table */}
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
                    isDeleting={false}
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

      {entries && entries.length === 0 && !entriesLoading && (
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

/* ── Inline-editable row ─────────────────────────────────────────── */

interface EnergyRowProps {
  entry: EnergyEntry
  zones: { value: string; label: string }[] | undefined
  onUpdate: (data: EnergyUpdateInput) => void
  onDelete: () => void
  isUpdating: boolean
  isDeleting: boolean
}

function EnergyRow({
  entry,
  zones,
  onUpdate,
  onDelete,
  isUpdating,
  isDeleting,
}: EnergyRowProps) {
  const [editing, setEditing] = useState(false)
  const [editKwh, setEditKwh] = useState('')
  const [editZone, setEditZone] = useState('')
  const [editDate, setEditDate] = useState('')

  const startEdit = () => {
    setEditKwh(String(entry.kwh_used ?? ''))
    setEditZone(entry.price_zone ?? '')
    setEditDate(entry.recorded_date ?? '')
    setEditing(true)
  }

  const cancelEdit = () => setEditing(false)

  const saveEdit = () => {
    const kwh = parseFloat(editKwh)
    if (isNaN(kwh) || kwh < 0) return

    onUpdate({
      kwh_used: kwh,
      price_zone: (editZone as PriceZone) || null,
      recorded_date: editDate || null,
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <tr className="bg-blue-50/40">
        <td className="px-4 py-1.5">
          <input
            type="number"
            min="0"
            step="any"
            value={editKwh}
            onChange={(e) => setEditKwh(e.target.value)}
            className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
            autoFocus
          />
        </td>
        <td className="px-4 py-1.5">
          <select
            value={editZone}
            onChange={(e) => setEditZone(e.target.value)}
            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="">—</option>
            {zones?.map((z) => (
              <option key={z.value} value={z.value}>
                {z.value}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-1.5 text-gray-400 text-xs">auto</td>
        <td className="px-4 py-1.5">
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </td>
        <td className="px-4 py-1.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={saveEdit}
              disabled={isUpdating}
              className="text-emerald-600 hover:text-emerald-800"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-2.5 font-medium text-gray-900">
        {entry.kwh_used?.toLocaleString('nb-NO', {
          maximumFractionDigits: 1,
        })}
      </td>
      <td className="px-4 py-2.5 text-gray-600">{entry.price_zone ?? '—'}</td>
      <td className="px-4 py-2.5 text-gray-600">
        {entry.total_co2_kg?.toLocaleString('nb-NO', {
          maximumFractionDigits: 2,
        })}
      </td>
      <td className="px-4 py-2.5 text-gray-500">
        {entry.recorded_date
          ? new Date(entry.recorded_date + 'T00:00:00').toLocaleDateString(
              'nb-NO',
            )
          : '—'}
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={startEdit}
            className="text-gray-400 transition-colors hover:text-blue-500"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="text-gray-400 transition-colors hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}
