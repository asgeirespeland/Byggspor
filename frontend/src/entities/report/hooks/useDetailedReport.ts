import { useAuthQuery } from '@/shared/hooks/useAuthQuery'
import { getDetailedReport } from '../api/detailedReport'

export function useDetailedReport(projectId: number) {
  return useAuthQuery(['detailed-report', projectId], (token) =>
    getDetailedReport(projectId, token),
  )
}
