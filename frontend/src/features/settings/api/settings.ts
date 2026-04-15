import { apiRequest } from '@/shared/api/client'

export type SettingSource = 'default' | 'organization' | 'project'

export type ResolvedSetting = {
  value: unknown
  source: SettingSource
}

export type SettingsResponse = {
  settings: Record<string, ResolvedSetting>
}

// -- Organization settings --

export function getOrgSettings(
  orgId: number,
  token?: string,
): Promise<SettingsResponse> {
  return apiRequest<SettingsResponse>(`/organizations/${orgId}/settings`, {
    token,
  })
}

export function patchOrgSettings(
  orgId: number,
  overrides: Record<string, unknown>,
  token?: string,
): Promise<SettingsResponse> {
  return apiRequest<SettingsResponse>(`/organizations/${orgId}/settings`, {
    method: 'PATCH',
    body: overrides,
    token,
  })
}

export function resetOrgSettings(
  orgId: number,
  token?: string,
): Promise<SettingsResponse> {
  return apiRequest<SettingsResponse>(`/organizations/${orgId}/settings`, {
    method: 'DELETE',
    token,
  })
}

// -- Project settings --

export function getProjectSettings(
  projectId: number,
  token?: string,
): Promise<SettingsResponse> {
  return apiRequest<SettingsResponse>(`/projects/${projectId}/settings`, {
    token,
  })
}

export function patchProjectSettings(
  projectId: number,
  overrides: Record<string, unknown>,
  token?: string,
): Promise<SettingsResponse> {
  return apiRequest<SettingsResponse>(`/projects/${projectId}/settings`, {
    method: 'PATCH',
    body: overrides,
    token,
  })
}

export function resetProjectSettings(
  projectId: number,
  token?: string,
): Promise<SettingsResponse> {
  return apiRequest<SettingsResponse>(`/projects/${projectId}/settings`, {
    method: 'DELETE',
    token,
  })
}

export function deleteProjectSetting(
  projectId: number,
  key: string,
  token?: string,
): Promise<SettingsResponse> {
  return apiRequest<SettingsResponse>(
    `/projects/${projectId}/settings/${key}`,
    {
      method: 'DELETE',
      token,
    },
  )
}
