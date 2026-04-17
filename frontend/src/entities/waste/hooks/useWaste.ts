/**
 * React Query hooks for waste: list, manual create, item patch, optimistic item delete, optimistic report
 * delete. Invalidates the project-waste + co2-summary + detailed-report trio on every write.
 */
import { useAuthMutation } from '@/shared/auth/useAuthMutation'
import { useAuthQuery } from '@/shared/auth/useAuthQuery'
import { useOptimisticDelete } from '@/widgets/data-table/useOptimisticDelete'
import { sumBy } from '@/shared/utils/collections'
import { qk, projectReportKeys } from '@/shared/api/queryKeys'

import {
  createManualWaste,
  getProjectWaste,
  updateWasteItem,
  deleteWasteItem,
  deleteWasteReport,
} from '../api'
import type { CreateManualWastePayload, WasteGroup } from '../types'

export function useProjectWaste(projectId: number) {
  return useAuthQuery(qk.waste(projectId), (token) =>
    getProjectWaste(projectId, token),
  )
}

export function useCreateManualWaste(projectId: number) {
  return useAuthMutation<CreateManualWastePayload>({
    mutationFn: (input, token) => createManualWaste(input, token),
    invalidateKeys: [qk.waste(projectId), ...projectReportKeys(projectId)],
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
