/**
 * Project entity backend client.
 * Exports types CreateProjectPayload, ProjectResponse and functions
 * createProject, listProjects, getProject.
 * NOTE: hooks/useProjects.ts and hooks/useProject.ts currently call apiRequest
 * directly instead of using listProjects/getProject — there is also a duplicate
 * Project type there. Unifying is a known cleanup.
 */
import { apiRequest } from '@/shared/api/client'

export type CreateProjectPayload = {
  name: string
  project_number?: string
  customer_id?: number
  customer_name?: string
}

export type ProjectResponse = {
  id: number
  name: string
  project_number: string | null
  status: string
  organization_id: number
  created_by_user_id: number
  customer_id: number | null
  customer_name: string | null
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
