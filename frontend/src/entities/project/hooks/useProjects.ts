import { useAuthQuery } from '@/shared/auth/useAuthQuery'
import { qk } from '@/shared/api/queryKeys'
import { getProject, listProjects } from '../api'

export type { Project } from '../api'

export function useProjects() {
  return useAuthQuery(qk.projects(), (token) => listProjects(token))
}

export function useProject(projectId: number) {
  return useAuthQuery(qk.project(projectId), (token) =>
    getProject(projectId, token),
  )
}
