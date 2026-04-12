import { useAuthMutation } from '@/shared/hooks/useAuthMutation'
import { useAuthQuery } from '@/shared/hooks/useAuthQuery'

import { createManualWaste, getProjectWaste } from '../api/waste'
import type { CreateManualWastePayload } from '../types/waste'

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
    ],
    successMessage: 'Avfallsdata lagret',
    errorMessage: 'Kunne ikke lagre avfallsdata',
  })
}
