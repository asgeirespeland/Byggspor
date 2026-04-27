import { useAuthMutation } from '@/shared/auth/useAuthMutation'
import { qk } from '@/shared/api/queryKeys'
import {
  createOrganization,
  type CreateOrganizationPayload,
  type OrgDto,
} from '@/entities/organization'

export function useCreateOrganization() {
  return useAuthMutation<CreateOrganizationPayload, OrgDto>({
    mutationFn: (payload, token) => createOrganization(payload, token),
    invalidateKeys: [qk.currentUser()],
    errorMessage: 'Klarte ikke opprette organisasjon',
  })
}
