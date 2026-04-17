/**
 * React Query hooks for organisation-level calculation settings (read, patch, reset-all).
 * Invalidates every downstream CO₂ query by key prefix because org settings are inherited
 * by all projects.
 */
import { useAuthQuery } from '@/shared/hooks/useAuthQuery'
import { useAuthMutation } from '@/shared/hooks/useAuthMutation'
import { qk, qkPrefix } from '@/shared/api/queryKeys'
import { getOrgSettings, patchOrgSettings, resetOrgSettings } from '../api'

export function useOrgSettings(orgId: number | undefined) {
  return useAuthQuery(
    qk.orgSettings(orgId),
    (token) => getOrgSettings(orgId!, token),
    { enabled: orgId != null },
  )
}

/** Query keys that inherit from org settings */
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
