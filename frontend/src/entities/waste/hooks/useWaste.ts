import { useAuthQuery } from '@/shared/auth/useAuthQuery'
import { qk } from '@/shared/api/queryKeys'

import { getProjectWaste } from '../api'

export function useProjectWaste(projectId: number) {
  return useAuthQuery(qk.waste(projectId), (token) =>
    getProjectWaste(projectId, token),
  )
}
