import { useAuthQuery } from '@/shared/auth/useAuthQuery'
import { qk } from '@/shared/api/queryKeys'

import { listProjectMaterials } from '../api'

export function useProjectMaterials(projectId: number) {
  return useAuthQuery(qk.materials(projectId), (token) =>
    listProjectMaterials(projectId, token),
  )
}
