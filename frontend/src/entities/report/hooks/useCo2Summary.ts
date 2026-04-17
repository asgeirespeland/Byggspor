import { useAuthQuery } from '@/shared/hooks/useAuthQuery'
import { qk } from '@/shared/api/queryKeys'
import { getCo2Summary } from '../api/co2Summary'

export function useCo2Summary(projectId: number) {
  return useAuthQuery(qk.co2Summary(projectId), (token) =>
    getCo2Summary(projectId, token),
  )
}
