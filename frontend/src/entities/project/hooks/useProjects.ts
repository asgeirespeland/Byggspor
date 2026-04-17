import { useAuthQuery } from '@/shared/hooks/useAuthQuery'
import { useAuthMutation } from '@/shared/hooks/useAuthMutation'
import { qk } from '@/shared/api/queryKeys'
import {
  createProject,
  getProject,
  listProjects,
  type CreateProjectPayload,
  type Project,
} from '../api'

export type { Project } from '../api'

export function useProjects() {
  return useAuthQuery(qk.projects(), (token) => listProjects(token))
}

export function useProject(projectId: number) {
  return useAuthQuery(qk.project(projectId), (token) =>
    getProject(projectId, token),
  )
}

export function useCreateProject() {
  return useAuthMutation<CreateProjectPayload, Project>({
    mutationFn: (payload, token) => createProject(payload, token),
    invalidateKeys: [qk.projects()],
    successMessage: 'Prosjekt opprettet',
    errorMessage: 'Kunne ikke opprette prosjekt',
  })
}
