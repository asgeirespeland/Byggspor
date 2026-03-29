import { useAuthMutation } from '@/shared/hooks/useAuthMutation'
import { createProject } from '../api/project'
import type { CreateProjectPayload, ProjectResponse } from '../api/project'

export function useCreateProject() {
  return useAuthMutation<CreateProjectPayload, ProjectResponse>({
    mutationFn: (payload, token) => createProject(payload, token),
    invalidateKeys: [['projects']],
    successMessage: 'Prosjekt opprettet',
    errorMessage: 'Kunne ikke opprette prosjekt',
  })
}
