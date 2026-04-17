import { useAuthMutation } from '@/shared/hooks/useAuthMutation'
import { createProject } from '../api'
import type { CreateProjectPayload, ProjectResponse } from '../api'

export function useCreateProject() {
  return useAuthMutation<CreateProjectPayload, ProjectResponse>({
    mutationFn: (payload, token) => createProject(payload, token),
    invalidateKeys: [['projects']],
    successMessage: 'Prosjekt opprettet',
    errorMessage: 'Kunne ikke opprette prosjekt',
  })
}
