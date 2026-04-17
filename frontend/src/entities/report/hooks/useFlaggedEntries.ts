import { useProjectMaterials } from '@/entities/materials/hooks/useProjectMaterials'
import { useProjectTransports } from '@/entities/transport/hooks/useProjectTransports'
import type { ProjectMaterialItem } from '@/entities/materials/api'
import type { ProjectTripItem } from '@/entities/transport/api/projectTransports'

export type FlaggedMaterial = ProjectMaterialItem & { kind: 'material' }
export type FlaggedTrip = ProjectTripItem & { kind: 'transport' }
export type FlaggedEntry = FlaggedMaterial | FlaggedTrip

export function useFlaggedEntries(projectId: number): FlaggedEntry[] {
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

  return [...flaggedMaterials, ...flaggedTrips]
}
