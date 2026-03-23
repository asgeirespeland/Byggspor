import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/react'
import { getCo2Summary } from '../api/report'

export function useCo2Summary(projectId: number) {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['co2-summary', projectId],
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('Ikke autentisert')
      return getCo2Summary(projectId, token)
    },
  })
}
