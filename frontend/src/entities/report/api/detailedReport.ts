import { apiRequest } from '@/shared/api/client'
import type { DetailedReport } from '../types'

export async function getDetailedReport(
  projectId: number,
  token?: string,
): Promise<DetailedReport> {
  return apiRequest<DetailedReport>(`/report/project/${projectId}/detailed`, {
    token,
  })
}
