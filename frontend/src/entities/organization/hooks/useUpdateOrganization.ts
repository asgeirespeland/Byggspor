import { useAuthMutation } from '@/shared/auth/useAuthMutation'
import { qk } from '@/shared/api/queryKeys'
import {
  updateOrganization,
  type OrgDto,
  type UpdateOrganizationPayload,
} from '../api'

export function useUpdateOrganization(orgId: number) {
  return useAuthMutation<UpdateOrganizationPayload, OrgDto>({
    mutationFn: (payload, token) => updateOrganization(orgId, payload, token),
    invalidateKeys: [qk.organization(orgId)],
    successMessage: 'Organisasjonsinfo ble oppdatert',
    errorMessage: 'Kunne ikke oppdatere organisasjonsinfo',
  })
}
