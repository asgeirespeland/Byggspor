/**
 * Post-upload edit/delete mutations for waste.
 * useUpdateWasteItem, useDeleteWasteItem, useDeleteWasteReport.
 */
import { useAuthMutation } from '@/shared/auth/useAuthMutation'
import { qk, projectReportKeys } from '@/shared/api/queryKeys'

import {
  updateWasteItem,
  deleteWasteItem,
  deleteWasteReport,
} from '@/entities/waste'
import type { WasteGroup, WasteItem } from '@/entities/waste'

import { useGroupDelete } from './useGroupDelete'
import { useItemDelete } from './useItemDelete'

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
  const { handleDelete, pendingId, undo } = useItemDelete<
    WasteGroup,
    WasteItem
  >({
    projectId,
    listQueryKey: qk.waste(projectId),
    co2Category: 'waste',
    groupIdOf: (g) => g.source_id,
    itemsOf: (g) => g.items,
    setItems: (g, items) => ({ ...g, items }),
    idOf: (item) => item.id,
    co2Of: (item) => item.total_co2_kg ?? 0,
    deleteFn: deleteWasteItem,
    successMessage: 'Avfallspost slettet',
    errorMessage: 'Kunne ikke slette avfallsposten',
  })

  return {
    deleteWasteItem: handleDelete,
    pendingWasteItemId: pendingId,
    undoWasteItemDelete: undo,
  }
}

export function useDeleteWasteReport(projectId: number) {
  const { handleDelete, pendingId, undo } = useGroupDelete<
    WasteGroup,
    WasteItem
  >({
    projectId,
    listQueryKey: qk.waste(projectId),
    co2Category: 'waste',
    matchBy: (g) => g.source_id,
    itemsOf: (g) => g.items,
    co2Of: (item) => item.total_co2_kg ?? 0,
    deleteFn: deleteWasteReport,
    successMessage: 'Avfallsrapport slettet',
    errorMessage: 'Kunne ikke slette avfallsrapporten',
  })

  return {
    deleteWasteReport: handleDelete,
    pendingWasteReportId: pendingId,
    undoWasteReportDelete: undo,
  }
}
