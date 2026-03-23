import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/react'
import { toast } from 'sonner'

import {
  listProjectTransports,
  deleteTransportReport,
} from '../api/projectTransports'

export function useProjectTransports(projectId: number) {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['project-transports', projectId],
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('Ikke autentisert')
      return listProjectTransports(projectId, token)
    },
  })
}

export function useDeleteTransportReport(projectId: number) {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reportId: number) => {
      const token = await getToken()
      if (!token) throw new Error('Ikke autentisert')
      return deleteTransportReport(reportId, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-transports', projectId],
      })
      queryClient.invalidateQueries({ queryKey: ['co2-summary', projectId] })
      toast.success('Kjørerapport slettet')
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Kunne ikke slette kjørerapport',
      )
    },
  })
}
