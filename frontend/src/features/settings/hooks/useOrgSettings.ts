import { useAuthQuery } from '@/shared/hooks/useAuthQuery'
import { useAuthMutation } from '@/shared/hooks/useAuthMutation'
import {
  getOrgSettings,
  patchOrgSettings,
  resetOrgSettings,
} from '../api/settings'

export function useOrgSettings(orgId: number | undefined) {
  return useAuthQuery(
    ['org-settings', orgId],
    (token) => getOrgSettings(orgId!, token),
    { enabled: orgId != null },
  )
}

export function useUpdateOrgSettings(orgId: number | undefined) {
  return useAuthMutation<Record<string, unknown>>({
    mutationFn: (overrides, token) =>
      patchOrgSettings(orgId!, overrides, token),
    invalidateKeys: [['org-settings', orgId]],
    successMessage: 'Innstillingene ble oppdatert',
    errorMessage: 'Kunne ikke oppdatere innstillingene',
  })
}

export function useResetOrgSettings(orgId: number | undefined) {
  return useAuthMutation<void>({
    mutationFn: (_data, token) => resetOrgSettings(orgId!, token),
    invalidateKeys: [['org-settings', orgId]],
    successMessage: 'Innstillingene ble tilbakestilt',
    errorMessage: 'Kunne ikke tilbakestille innstillingene',
  })
}
