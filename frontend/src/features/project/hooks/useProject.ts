import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/react'
import { apiRequest } from '@/shared/api/client'
import type { Project } from './useProjects'

export function useProject(projectId: number) {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('Ikke autentisert')
      return apiRequest<Project>(`/projects/${projectId}`, { token })
    },
  })
}
