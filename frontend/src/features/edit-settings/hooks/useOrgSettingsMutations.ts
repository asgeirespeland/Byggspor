/**
 * Org-level settings mutations. Both invalidate the full downstream CO₂ query tree
 * because org settings are inherited by every project.
 */
import { useAuthMutation } from '@/shared/auth/useAuthMutation'
import { qkPrefix } from '@/shared/api/queryKeys'
import { patchOrgSettings, resetOrgSettings } from '@/entities/settings/api'

const ORG_DOWNSTREAM_KEYS = [
  qkPrefix.orgSettings(),
  qkPrefix.projectSettings(),
  qkPrefix.energies(),
  qkPrefix.materials(),
  qkPrefix.waste(),
  qkPrefix.co2Summary(),
  qkPrefix.detailedReport(),
]

export function useUpdateOrgSettings(orgId: number | undefined) {
  return useAuthMutation<Record<string, unknown>>({
    mutationFn: (overrides, token) =>
      patchOrgSettings(orgId!, overrides, token),
    invalidateKeys: ORG_DOWNSTREAM_KEYS,
    successMessage: 'Innstillingene ble oppdatert',
    errorMessage: 'Kunne ikke oppdatere innstillingene',
  })
}

export function useResetOrgSettings(orgId: number | undefined) {
  return useAuthMutation<void>({
    mutationFn: (_data, token) => resetOrgSettings(orgId!, token),
    invalidateKeys: ORG_DOWNSTREAM_KEYS,
    successMessage: 'Innstillingene ble tilbakestilt',
    errorMessage: 'Kunne ikke tilbakestille innstillingene',
  })
}
