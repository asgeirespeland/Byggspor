import { useAuthQuery } from '@/shared/hooks/useAuthQuery'
import { getCo2Summary } from '../api/co2Summary'

export function useCo2Summary(projectId: number) {
  return useAuthQuery(['co2-summary', projectId], (token) =>
    getCo2Summary(projectId, token),
  )
}
