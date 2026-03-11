import { apiRequest } from '@/shared/api/client'

export type CreateProjectPayload = {
  name: string
  project_number?: string
  customer_id?: number
}

export type ProjectResponse = {
  id: number
  name: string
  project_number: string | null
  status: string
  organization_id: number
  created_by_user_id: number
  customer_id: number | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

export function createProject(
  payload: CreateProjectPayload,
  token?: string,
): Promise<ProjectResponse> {
  return apiRequest<ProjectResponse>('/projects', {
    method: 'POST',
    body: payload,
    token,
  })
}

export function listProjects(token?: string): Promise<ProjectResponse[]> {
  return apiRequest<ProjectResponse[]>('/projects', { token })
}

export function getProject(
  id: number,
  token?: string,
): Promise<ProjectResponse> {
  return apiRequest<ProjectResponse>(`/projects/${id}`, { token })
}
