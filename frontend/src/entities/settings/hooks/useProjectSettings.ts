/**
 * React Query hooks for per-project calculation settings (read, patch, reset key, reset all).
 * The invalidateKeys list fans out to every CO₂-dependent query because a settings change
 * recomputes derived values server-side.
 */
import { useAuthQuery } from '@/shared/auth/useAuthQuery'
import { useAuthMutation } from '@/shared/auth/useAuthMutation'
import { qk } from '@/shared/api/queryKeys'
import {
  getProjectSettings,
  patchProjectSettings,
  deleteProjectSetting,
  resetProjectSettings,
} from '../api'

export function useProjectSettings(projectId: number | undefined) {
  return useAuthQuery(
    qk.projectSettings(projectId),
    (token) => getProjectSettings(projectId!, token),
    { enabled: projectId != null },
  )
}

/** Query keys that depend on calculated CO₂ values */
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
