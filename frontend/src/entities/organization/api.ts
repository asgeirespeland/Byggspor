import { apiRequest } from '@/shared/api/client'

export type OrgDto = {
  id: number
  name: string
  org_type: string
  org_number: string | null
}

export type OrgMemberDto = {
  id: number
  user_id: number
  role: string
  user: {
    name: string
    email: string
  }
}

export type OrgMemberCandidateDto = {
  id: number
  name: string
  email: string
  phone: string | null
}

export type CreateOrganizationPayload = {
  name: string
  org_number?: string
  org_type: string
}

export function getOrganization(id: number, token?: string): Promise<OrgDto> {
  return apiRequest<OrgDto>(`/organizations/${id}`, { token })
}

export function createOrganization(
  payload: CreateOrganizationPayload,
  token?: string,
): Promise<OrgDto> {
  return apiRequest<OrgDto>('/organizations', {
    method: 'POST',
    body: payload,
    token,
  })
}

export function listOrgMembers(
  organizationId: number,
  token?: string,
): Promise<OrgMemberDto[]> {
  return apiRequest<OrgMemberDto[]>(
    `/organizations/${organizationId}/members`,
    { token },
  )
}

export function searchOrgMemberCandidates(
  organizationId: number,
  query: string,
  token?: string,
): Promise<OrgMemberCandidateDto[]> {
  const params = new URLSearchParams({ query })
  return apiRequest<OrgMemberCandidateDto[]>(
    `/organizations/${organizationId}/member-candidates?${params.toString()}`,
    { token },
  )
}

export type AddMemberPayload = {
  user_id: number
  role: string
}

export function addOrgMember(
  organizationId: number,
  payload: AddMemberPayload,
  token?: string,
): Promise<void> {
  return apiRequest(`/organizations/${organizationId}/members`, {
    method: 'POST',
    body: payload,
    token,
  })
}

export function removeOrgMember(
  organizationId: number,
  userId: number,
  token?: string,
): Promise<void> {
  return apiRequest(`/organizations/${organizationId}/members/${userId}`, {
    method: 'DELETE',
    token,
  })
}
