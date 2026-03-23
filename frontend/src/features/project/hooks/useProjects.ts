import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/react'
import { apiRequest } from '@/shared/api/client'

export type Project = {
  id: number
  name: string
  project_number: string | null
  status: 'active' | 'completed' | 'archived'
  organization_id: number
  created_by_user_id: number
  customer_id: number | null
  customer_name: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

export function useProjects() {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('Ikke autentisert')
      return apiRequest<Project[]>('/projects', { token })
    },
  })
}
