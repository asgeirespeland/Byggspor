import { useState } from 'react'
import { AlertTriangle, Package, Truck, Check, Loader2 } from 'lucide-react'
import {
  useProjectMaterials,
  useUpdateMaterial,
} from '@/features/invoice/hooks/useProjectMaterials'
import { useProjectTransports } from '@/features/transport/hooks/useProjectTransports'
import type { ProjectMaterialItem } from '@/features/invoice/api/invoice'
import type { ProjectTripItem } from '@/features/transport/api/projectTransports'

type FlaggedMaterial = ProjectMaterialItem & { kind: 'material' }
type FlaggedTrip = ProjectTripItem & { kind: 'transport' }
type FlaggedEntry = FlaggedMaterial | FlaggedTrip

interface Props {
  projectId: number
  onNavigateToTab?: (tab: 'materials' | 'transport') => void
}

export default function FlaggedItems({ projectId, onNavigateToTab }: Props) {
  const { data: invoiceGroups } = useProjectMaterials(projectId)
  const { data: reportGroups } = useProjectTransports(projectId)

  const flaggedMaterials: FlaggedMaterial[] =
    invoiceGroups?.flatMap((g) =>
      g.items
        .filter((item) => item.flagged)
        .map((item) => ({ ...item, kind: 'material' as const })),
    ) ?? []

  const flaggedTrips: FlaggedTrip[] =
    reportGroups?.flatMap((g) =>
      g.trips
        .filter((t) => t.flagged)
        .map((t) => ({ ...t, kind: 'transport' as const })),
    ) ?? []

  const flagged: FlaggedEntry[] = [...flaggedMaterials, ...flaggedTrips]

  if (flagged.length === 0) return null

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
          Trenger oppmerksomhet ({flagged.length})
        </p>
      </div>

      <div className="space-y-2">
        {flagged
          .slice(0, 8)
          .map((entry) =>
            entry.kind === 'material' ? (
              <MaterialRow
                key={`m-${entry.id}`}
                item={entry}
                projectId={projectId}
              />
            ) : (
              <TripRow
                key={`t-${entry.id}`}
                trip={entry}
                onNavigate={() => onNavigateToTab?.('transport')}
              />
            ),
          )}
        {flagged.length > 8 && (
          <p className="text-xs text-amber-600">
            + {flagged.length - 8} flere poster
          </p>
        )}
      </div>
    </div>
  )
}

function MaterialRow({
  item,
  projectId,
}: {
  item: FlaggedMaterial
  projectId: number
}) {
  const [editing, setEditing] = useState(false)
  const [co2Value, setCo2Value] = useState('')
  const updateMutation = useUpdateMaterial(projectId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseFloat(co2Value)
    if (isNaN(val) || val < 0) return
    updateMutation.mutate(
      { materialId: item.id, total_co2_kg: val },
      {
        onSuccess: () => {
          setEditing(false)
          setCo2Value('')
        },
      },
    )
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSubmit}
        className="rounded-lg bg-white p-2 space-y-1.5"
      >
        <p className="text-xs text-gray-600 truncate">
          {item.material_name ?? 'Ukjent'}
        </p>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            step="any"
            min="0"
            placeholder="kg CO₂"
            value={co2Value}
            onChange={(e) => setCo2Value(e.target.value)}
            className="h-7 w-full rounded border border-gray-200 px-2 text-xs focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            autoFocus
          />
          <button
            type="submit"
            disabled={updateMutation.isPending || !co2Value}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-amber-500 text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Avbryt
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="flex items-start gap-2">
      <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-gray-700">
          {item.material_name ?? 'Ukjent materiale'}
        </p>
        <p className="text-[11px] text-amber-600">
          {item.has_epd ? 'Mangler ID' : 'Mangler EPD / CO₂-data'}
        </p>
      </div>
      <button
        onClick={() => setEditing(true)}
        className="shrink-0 text-[11px] font-medium text-amber-600 hover:text-amber-800"
      >
        Korriger
      </button>
    </div>
  )
}

function TripRow({
  trip,
  onNavigate,
}: {
  trip: FlaggedTrip
  onNavigate: () => void
}) {
  return (
    <div className="flex items-start gap-2">
      <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-gray-700">
          {trip.start_address ?? '?'} → {trip.end_address ?? '?'}
        </p>
        <p className="text-[11px] text-amber-600">Mangler utslippsdata</p>
      </div>
      <button
        onClick={onNavigate}
        className="shrink-0 text-[11px] font-medium text-amber-600 hover:text-amber-800"
      >
        Se tur
      </button>
    </div>
  )
}
