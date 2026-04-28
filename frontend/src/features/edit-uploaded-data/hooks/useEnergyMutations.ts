/**
 * Post-logging edit/delete mutations for energy entries.
 * useUpdateEnergy (patch kwh/zone/date), useDeleteEnergy (optimistic with undo).
 * Both invalidate ['energies'] + ['co2-summary'] + ['detailed-report'] for the given projectId.
 */
import { useAuthMutation } from '@/shared/auth/useAuthMutation'
import { useOptimisticDelete } from './useOptimisticDelete'
import { qk, projectReportKeys } from '@/shared/api/queryKeys'

import { deleteEnergy, updateEnergy } from '@/entities/energy'
import type { EnergyEntry, EnergyUpdateInput } from '@/entities/energy'

export function useUpdateEnergy(projectId: number) {
  return useAuthMutation<{ energyId: number; data: EnergyUpdateInput }>({
    mutationFn: ({ energyId, data }, token) =>
      updateEnergy(energyId, data, token),
    invalidateKeys: [qk.energies(projectId), ...projectReportKeys(projectId)],
    successMessage: 'Energidata oppdatert',
    errorMessage: 'Kunne ikke oppdatere energidata',
  })
}

export function useDeleteEnergy(projectId: number) {
  const { handleDelete, pendingId, undo } = useOptimisticDelete<EnergyEntry[]>({
    projectId,
    listQueryKey: qk.energies(projectId),
    co2Category: 'energy',
    prepare: (snapshot, id) => ({
      updatedList: snapshot?.filter((e) => e.id !== id) ?? [],
      co2Delta: snapshot?.find((e) => e.id === id)?.total_co2_kg ?? 0,
      entryCountDelta: 1,
    }),
    deleteFn: deleteEnergy,
    successMessage: 'Energidata slettet',
    errorMessage: 'Kunne ikke slette energidata',
  })

  return {
    deleteEnergy: handleDelete,
    pendingEnergyId: pendingId,
    undoEnergyDelete: undo,
  }
}
