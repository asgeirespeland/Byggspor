import { deleteProject } from '@/entities/project'
import { qk } from '@/shared/api/queryKeys'
import { useAuthMutation } from '@/shared/auth/useAuthMutation'

export function useDeleteProject(projectId: number) {
  return useAuthMutation<void, { status: string }>({
    mutationFn: (_payload, token) => deleteProject(projectId, token),
    invalidateKeys: [qk.project(projectId), qk.projects()],
    successMessage: 'Prosjektet ble slettet',
    errorMessage: 'Kunne ikke slette prosjektet',
  })
}
