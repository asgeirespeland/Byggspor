import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/react'
import { toast } from 'sonner'
import { createProject } from '../api/project'
import type { CreateProjectPayload } from '../api/project'

export function useCreateProject() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateProjectPayload) => {
      const token = (await getToken()) ?? undefined
      return createProject(payload, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Prosjekt opprettet')
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Kunne ikke opprette prosjekt',
      )
    },
  })
}
