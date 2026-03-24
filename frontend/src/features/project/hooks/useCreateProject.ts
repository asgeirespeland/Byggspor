import { useAuthMutation } from '@/shared/hooks/useAuthMutation'
import { createProject } from '../api/project'
import type { CreateProjectPayload } from '../api/project'

export function useCreateProject() {
  return useAuthMutation<CreateProjectPayload>({
    mutationFn: (payload, token) => createProject(payload, token),
    invalidateKeys: [['projects']],
    successMessage: 'Prosjekt opprettet',
    errorMessage: 'Kunne ikke opprette prosjekt',
  })
}
