import { useAuthMutation } from '@/shared/auth/useAuthMutation'
import { qk, projectReportKeys } from '@/shared/api/queryKeys'

import { calculateEnergy } from '@/entities/energy'
import type { EnergyCalculateInput } from '@/entities/energy'

export function useCalculateEnergy(projectId: number) {
  return useAuthMutation<EnergyCalculateInput>({
    mutationFn: (input, token) => calculateEnergy(input, token),
    invalidateKeys: [qk.energies(projectId), ...projectReportKeys(projectId)],
    successMessage: 'Energidata lagret',
    errorMessage: 'Kunne ikke lagre energidata',
  })
}
