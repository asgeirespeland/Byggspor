/**
 * Post-upload edit/delete mutations for waste.
 * useUpdateWasteItem, useDeleteWasteItem, useDeleteWasteReport.
 * All invalidate project-waste + co2-summary + detailed-report on writes; deletes go through
 * useOptimisticDelete with co2Category 'waste' so KPIs update optimistically.
 */
import { useAuthMutation } from '@/shared/auth/useAuthMutation'
import { useOptimisticDelete } from '@/widgets/data-table/useOptimisticDelete'
import { sumBy } from '@/shared/utils/collections'
import { qk, projectReportKeys } from '@/shared/api/queryKeys'

import {
  updateWasteItem,
  deleteWasteItem,
  deleteWasteReport,
} from '@/entities/waste/api'
import type { WasteGroup } from '@/entities/waste/types'

export function useUpdateWasteItem(projectId: number) {
  return useAuthMutation<
    {
      itemId: number
      data: {
        waste_type?: string
        quantity?: number
        total_co2_kg?: number
      }
    },
    unknown
  >({
    mutationFn: ({ itemId, data }, token) =>
      updateWasteItem(itemId, data, token),
    invalidateKeys: [qk.waste(projectId), ...projectReportKeys(projectId)],
    successMessage: 'Avfallspost oppdatert',
    errorMessage: 'Kunne ikke oppdatere avfallsposten',
  })
}

export function useDeleteWasteItem(projectId: number) {
  const { handleDelete, pendingId, undo } = useOptimisticDelete<WasteGroup[]>({
    projectId,
    listQueryKey: qk.waste(projectId),
    co2Category: 'waste',
    prepare: (snapshot, itemId) => {
      const item = snapshot
        ?.flatMap((g) => g.items)
        .find((i) => i.id === itemId)
      return {
        updatedList:
          snapshot
            ?.map((g) => ({
              ...g,
              items: g.items.filter((i) => i.id !== itemId),
            }))
            .filter((g) => g.items.length > 0) ?? [],
        co2Delta: item?.total_co2_kg ?? 0,
        entryCountDelta: 1,
      }
    },
    deleteFn: deleteWasteItem,
    errorMessage: 'Kunne ikke slette avfallsposten',
  })

  return {
    deleteWasteItem: handleDelete,
    pendingWasteItemId: pendingId,
    undoWasteItemDelete: undo,
  }
}

export function useDeleteWasteReport(projectId: number) {
  const { handleDelete, pendingId, undo } = useOptimisticDelete<WasteGroup[]>({
    projectId,
    listQueryKey: qk.waste(projectId),
    co2Category: 'waste',
    prepare: (snapshot, sourceId) => {
      const group = snapshot?.find((g) => g.source_id === sourceId)
      return {
        updatedList: snapshot?.filter((g) => g.source_id !== sourceId) ?? [],
        co2Delta: sumBy(group?.items ?? [], (item) => item.total_co2_kg),
        entryCountDelta: group?.items.length ?? 0,
      }
    },
    deleteFn: deleteWasteReport,
    errorMessage: 'Kunne ikke slette avfallsrapporten',
  })

  return {
    deleteWasteReport: handleDelete,
    pendingWasteReportId: pendingId,
    undoWasteReportDelete: undo,
  }
}
