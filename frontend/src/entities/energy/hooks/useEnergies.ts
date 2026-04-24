import { useAuthQuery } from '@/shared/auth/useAuthQuery'
import { qk } from '@/shared/api/queryKeys'

import { listEnergies, listPriceZones } from '../api'

export function useEnergies(projectId: number) {
  return useAuthQuery(qk.energies(projectId), (token) =>
    listEnergies(projectId, token),
  )
}

export function usePriceZones() {
  return useAuthQuery(qk.priceZones(), (token) => listPriceZones(token), {
    staleTime: Infinity,
  })
}
