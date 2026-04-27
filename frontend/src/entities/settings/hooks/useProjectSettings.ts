import { useAuthQuery } from '@/shared/auth/useAuthQuery'
import { qk } from '@/shared/api/queryKeys'
import { getProjectSettings } from '../api'

export function useProjectSettings(projectId: number | undefined) {
  return useAuthQuery(
    qk.projectSettings(projectId),
    (token) => getProjectSettings(projectId!, token),
    { enabled: projectId != null },
  )
}
