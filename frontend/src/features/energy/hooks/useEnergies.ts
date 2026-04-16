import { useAuthQuery } from '@/shared/hooks/useAuthQuery'
import { useAuthMutation } from '@/shared/hooks/useAuthMutation'
import { useOptimisticDelete } from '@/shared/hooks/useOptimisticDelete'

import {
  calculateEnergy,
  listEnergies,
  deleteEnergy,
  updateEnergy,
  listPriceZones,
} from '../api/energy'
import type {
  EnergyCalculateInput,
  EnergyEntry,
  EnergyUpdateInput,
} from '../types/energy'

export function useEnergies(projectId: number) {
  return useAuthQuery(['energies', projectId], (token) =>
    listEnergies(projectId, token),
  )
}

export function usePriceZones() {
  return useAuthQuery(['price-zones'], (token) => listPriceZones(token), {
    staleTime: Infinity,
  })
}

export function useCalculateEnergy(projectId: number) {
  return useAuthMutation<EnergyCalculateInput>({
    mutationFn: (input, token) => calculateEnergy(input, token),
    invalidateKeys: [
      ['energies', projectId],
      ['co2-summary', projectId],
      ['detailed-report', projectId],
    ],
    successMessage: 'Energidata lagret',
    errorMessage: 'Kunne ikke lagre energidata',
  })
}

export function useUpdateEnergy(projectId: number) {
  return useAuthMutation<{ energyId: number; data: EnergyUpdateInput }>({
    mutationFn: ({ energyId, data }, token) =>
      updateEnergy(energyId, data, token),
    invalidateKeys: [
      ['energies', projectId],
      ['co2-summary', projectId],
      ['detailed-report', projectId],
    ],
    successMessage: 'Energidata oppdatert',
    errorMessage: 'Kunne ikke oppdatere energidata',
  })
}

export function useDeleteEnergy(projectId: number) {
  const { handleDelete, pendingId, undo } = useOptimisticDelete<EnergyEntry[]>({
    projectId,
    listQueryKey: ['energies', projectId],
    co2Category: 'energy',
    prepare: (snapshot, id) => ({
      updatedList: snapshot?.filter((e) => e.id !== id) ?? [],
      co2Delta: snapshot?.find((e) => e.id === id)?.total_co2_kg ?? 0,
      entryCountDelta: 1,
    }),
    deleteFn: deleteEnergy,
    errorMessage: 'Kunne ikke slette energidata',
  })

  return {
    deleteEnergy: handleDelete,
    pendingEnergyId: pendingId,
    undoEnergyDelete: undo,
  }
}
