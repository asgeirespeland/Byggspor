import { useAuthMutation } from '@/shared/auth/useAuthMutation'
import { qk, projectReportKeys } from '@/shared/api/queryKeys'

import { createManualWaste } from '@/entities/waste'
import type { CreateManualWastePayload } from '@/entities/waste'

export function useCreateManualWaste(projectId: number) {
  return useAuthMutation<CreateManualWastePayload>({
    mutationFn: (input, token) => createManualWaste(input, token),
    invalidateKeys: [qk.waste(projectId), ...projectReportKeys(projectId)],
    successMessage: 'Avfallsdata lagret',
    errorMessage: 'Kunne ikke lagre avfallsdata',
  })
}
