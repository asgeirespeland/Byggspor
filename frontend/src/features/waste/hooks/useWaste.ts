import { useAuthMutation } from '@/shared/hooks/useAuthMutation'
import { useAuthQuery } from '@/shared/hooks/useAuthQuery'
import { useOptimisticDelete } from '@/shared/hooks/useOptimisticDelete'

import {
  createManualWaste,
  getProjectWaste,
  updateWasteItem,
  deleteWasteItem,
  deleteWasteReport,
} from '../api/waste'
import type { CreateManualWastePayload, WasteGroup } from '../types/waste'

export function useProjectWaste(projectId: number) {
  return useAuthQuery(['project-waste', projectId], (token) =>
    getProjectWaste(projectId, token),
  )
}

export function useCreateManualWaste(projectId: number) {
  return useAuthMutation<CreateManualWastePayload>({
    mutationFn: (input, token) => createManualWaste(input, token),
    invalidateKeys: [
      ['project-waste', projectId],
      ['co2-summary', projectId],
      ['detailed-report', projectId],
    ],
    successMessage: 'Avfallsdata lagret',
    errorMessage: 'Kunne ikke lagre avfallsdata',
  })
}

export function useUpdateWasteItem(projectId: number) {
  return useAuthMutation<
    {
      itemId: number
      data: {
        waste_type?: string
        quantity_tons?: number
        total_co2_kg?: number
      }
    },
    unknown
  >({
    mutationFn: ({ itemId, data }, token) =>
      updateWasteItem(itemId, data, token),
    invalidateKeys: [
      ['project-waste', projectId],
      ['co2-summary', projectId],
      ['detailed-report', projectId],
    ],
    successMessage: 'Avfallspost oppdatert',
    errorMessage: 'Kunne ikke oppdatere avfallsposten',
  })
}

export function useDeleteWasteItem(projectId: number) {
  const { handleDelete, pendingId, undo } = useOptimisticDelete<WasteGroup[]>({
    projectId,
    listQueryKey: ['project-waste', projectId],
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
    listQueryKey: ['project-waste', projectId],
    co2Category: 'waste',
    prepare: (snapshot, sourceId) => {
      const group = snapshot?.find((g) => g.source_id === sourceId)
      return {
        updatedList: snapshot?.filter((g) => g.source_id !== sourceId) ?? [],
        co2Delta:
          group?.items.reduce(
            (sum, item) => sum + (item.total_co2_kg ?? 0),
            0,
          ) ?? 0,
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
