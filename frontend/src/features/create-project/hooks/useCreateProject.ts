import { useAuthMutation } from '@/shared/auth/useAuthMutation'
import { qk } from '@/shared/api/queryKeys'
import {
  createProject,
  type CreateProjectPayload,
  type Project,
} from '@/entities/project'

export function useCreateProject() {
  return useAuthMutation<CreateProjectPayload, Project>({
    mutationFn: (payload, token) => createProject(payload, token),
    invalidateKeys: [qk.projects()],
    successMessage: 'Prosjekt opprettet',
    errorMessage: 'Kunne ikke opprette prosjekt',
  })
}
