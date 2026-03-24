import { useAuthQuery } from '@/shared/hooks/useAuthQuery'
import { apiRequest } from '@/shared/api/client'
import type { Project } from './useProjects'

export function useProject(projectId: number) {
  return useAuthQuery(['projects', projectId], (token) =>
    apiRequest<Project>(`/projects/${projectId}`, { token }),
  )
}
