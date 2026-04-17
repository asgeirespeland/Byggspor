import { useAuthQuery } from '@/shared/auth/useAuthQuery'
import { qk } from '@/shared/api/queryKeys'
import { getDetailedReport } from '../api/detailedReport'

export function useDetailedReport(projectId: number) {
  return useAuthQuery(qk.detailedReport(projectId), (token) =>
    getDetailedReport(projectId, token),
  )
}
