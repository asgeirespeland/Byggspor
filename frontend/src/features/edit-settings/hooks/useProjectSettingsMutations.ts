/**
 * Per-project settings mutations. All three invalidate the CO₂-derived query set
 * for the project because a settings change recomputes derived values server-side.
 */
import { useAuthMutation } from '@/shared/auth/useAuthMutation'
import { qk } from '@/shared/api/queryKeys'
import {
  patchProjectSettings,
  deleteProjectSetting,
  resetProjectSettings,
} from '@/entities/settings'

function projectSettingsDataKeys(projectId: number | undefined) {
  if (projectId == null) return []
  return [
    qk.projectSettings(projectId),
    qk.energies(projectId),
    qk.materials(projectId),
    qk.waste(projectId),
    qk.co2Summary(projectId),
    qk.detailedReport(projectId),
  ]
}

export function useUpdateProjectSettings(projectId: number | undefined) {
  return useAuthMutation<Record<string, unknown>>({
    mutationFn: (overrides, token) =>
      patchProjectSettings(projectId!, overrides, token),
    invalidateKeys: projectSettingsDataKeys(projectId),
    successMessage: 'Innstillingene ble lagret',
    errorMessage: 'Kunne ikke oppdatere innstillingene',
  })
}

export function useResetProjectSetting(projectId: number | undefined) {
  return useAuthMutation<string>({
    mutationFn: (key, token) => deleteProjectSetting(projectId!, key, token),
    invalidateKeys: projectSettingsDataKeys(projectId),
    successMessage: 'Innstillingen ble tilbakestilt',
    errorMessage: 'Kunne ikke tilbakestille innstillingen',
  })
}

export function useResetAllProjectSettings(projectId: number | undefined) {
  return useAuthMutation<void>({
    mutationFn: (_data, token) => resetProjectSettings(projectId!, token),
    invalidateKeys: projectSettingsDataKeys(projectId),
    successMessage: 'Innstillingene ble tilbakestilt',
    errorMessage: 'Kunne ikke tilbakestille innstillingene',
  })
}
