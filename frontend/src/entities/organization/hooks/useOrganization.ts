import { useAuthQuery } from '@/shared/auth/useAuthQuery'
import { useAuthMutation } from '@/shared/auth/useAuthMutation'
import { qk } from '@/shared/api/queryKeys'
import {
  createOrganization,
  getOrganization,
  type CreateOrganizationPayload,
  type OrgDto,
} from '../api'

export function useOrganization(id: number | null | undefined) {
  return useAuthQuery<OrgDto>(
    qk.organization(id ?? 0),
    (token) => getOrganization(id as number, token),
    { enabled: typeof id === 'number' },
  )
}

export function useCreateOrganization() {
  return useAuthMutation<CreateOrganizationPayload, OrgDto>({
    mutationFn: (payload, token) => createOrganization(payload, token),
    invalidateKeys: [qk.currentUser()],
    errorMessage: 'Klarte ikke opprette organisasjon',
  })
}
