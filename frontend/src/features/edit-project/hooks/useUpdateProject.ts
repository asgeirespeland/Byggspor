import {
  updateProject,
  type Project,
  type UpdateProjectPayload,
} from '@/entities/project'
import { qk } from '@/shared/api/queryKeys'
import { useAuthMutation } from '@/shared/auth/useAuthMutation'

export function useUpdateProject(projectId: number) {
  return useAuthMutation<UpdateProjectPayload, Project>({
    mutationFn: (payload, token) => updateProject(projectId, payload, token),
    invalidateKeys: [qk.project(projectId), qk.projects()],
    successMessage: 'Prosjektet ble oppdatert',
    errorMessage: 'Kunne ikke oppdatere prosjektet',
  })
}
