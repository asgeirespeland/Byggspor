import { useAuthQuery } from '@/shared/auth/useAuthQuery'
import { qk } from '@/shared/api/queryKeys'

import { listProjectTransports } from '../api/projectTransports'

export function useProjectTransports(projectId: number) {
  return useAuthQuery(qk.transports(projectId), (token) =>
    listProjectTransports(projectId, token),
  )
}
