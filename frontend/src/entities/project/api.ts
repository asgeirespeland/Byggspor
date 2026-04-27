/**
 * Project entity backend client.
 * Exports the Project type and createProject / listProjects / getProject.
 */
import { apiRequest } from '@/shared/api/client'

export type CreateProjectPayload = {
  name: string
  project_number?: string
  customer_id?: number
  customer_name?: string
}

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

export type UpdateProjectPayload = {
  name: string
}

export function createProject(
  payload: CreateProjectPayload,
  token?: string,
): Promise<Project> {
  return apiRequest<Project>('/projects', {
    method: 'POST',
    body: payload,
    token,
  })
}

export function listProjects(token?: string): Promise<Project[]> {
  return apiRequest<Project[]>('/projects', { token })
}

export function getProject(id: number, token?: string): Promise<Project> {
  return apiRequest<Project>(`/projects/${id}`, { token })
}

export function updateProject(
  id: number,
  payload: UpdateProjectPayload,
  token?: string,
): Promise<Project> {
  return apiRequest<Project>(`/projects/${id}`, {
    method: 'PATCH',
    body: payload,
    token,
  })
}
