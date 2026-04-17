/**
 * React Query hooks for per-project calculation settings (read, patch, reset key, reset all).
 * The invalidateKeys list fans out to every CO₂-dependent query because a settings change
 * recomputes derived values server-side.
 */
import { useAuthQuery } from '@/shared/hooks/useAuthQuery'
import { useAuthMutation } from '@/shared/hooks/useAuthMutation'
import {
  getProjectSettings,
  patchProjectSettings,
  deleteProjectSetting,
  resetProjectSettings,
} from '../api'

export function useProjectSettings(projectId: number | undefined) {
  return useAuthQuery(
    ['project-settings', projectId],
    (token) => getProjectSettings(projectId!, token),
    { enabled: projectId != null },
  )
}

/** Query keys that depend on calculated CO₂ values */
function projectDataKeys(projectId: number | undefined) {
  return [
    ['project-settings', projectId],
    ['energies', projectId],
    ['project-materials', projectId],
    ['project-waste', projectId],
    ['co2-summary', projectId],
    ['detailed-report', projectId],
  ]
}

export function useUpdateProjectSettings(projectId: number | undefined) {
  return useAuthMutation<Record<string, unknown>>({
    mutationFn: (overrides, token) =>
      patchProjectSettings(projectId!, overrides, token),
    invalidateKeys: projectDataKeys(projectId),
    successMessage: 'Innstillingene ble lagret',
    errorMessage: 'Kunne ikke oppdatere innstillingene',
  })
}

export function useResetProjectSetting(projectId: number | undefined) {
  return useAuthMutation<string>({
    mutationFn: (key, token) => deleteProjectSetting(projectId!, key, token),
    invalidateKeys: projectDataKeys(projectId),
    successMessage: 'Innstillingen ble tilbakestilt',
    errorMessage: 'Kunne ikke tilbakestille innstillingen',
  })
}

export function useResetAllProjectSettings(projectId: number | undefined) {
  return useAuthMutation<void>({
    mutationFn: (_data, token) => resetProjectSettings(projectId!, token),
    invalidateKeys: projectDataKeys(projectId),
    successMessage: 'Innstillingene ble tilbakestilt',
    errorMessage: 'Kunne ikke tilbakestille innstillingene',
  })
}
