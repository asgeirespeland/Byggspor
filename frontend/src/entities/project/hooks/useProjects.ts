import { useAuthQuery } from '@/shared/hooks/useAuthQuery'
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
  return useAuthQuery(['projects'], (token) =>
    apiRequest<Project[]>('/projects', { token }),
  )
}
