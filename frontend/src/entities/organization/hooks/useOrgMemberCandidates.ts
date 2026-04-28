import { useAuthQuery } from '@/shared/auth/useAuthQuery'
import { qk } from '@/shared/api/queryKeys'
import { searchOrgMemberCandidates, type OrgMemberCandidateDto } from '../api'

export function useOrgMemberCandidates(
  organizationId: number | null,
  query: string,
  enabled = true,
) {
  const normalizedQuery = query.trim()

  return useAuthQuery<OrgMemberCandidateDto[]>(
    qk.orgMemberCandidates(organizationId, normalizedQuery),
    (token) =>
      searchOrgMemberCandidates(
        organizationId as number,
        normalizedQuery,
        token,
      ),
    {
      enabled:
        enabled &&
        typeof organizationId === 'number' &&
        normalizedQuery.length > 0,
    },
  )
}
