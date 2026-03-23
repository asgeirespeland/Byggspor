import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/react'
import { toast } from 'sonner'

import {
  listProjectMaterials,
  uploadInvoice,
  deleteInvoice,
} from '../api/invoice'

export function useProjectMaterials(projectId: number) {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['project-materials', projectId],
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('Ikke autentisert')
      return listProjectMaterials(projectId, token)
    },
  })
}

export function useUploadInvoice(projectId: number) {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const token = await getToken()
      if (!token) throw new Error('Ikke autentisert')
      return uploadInvoice(file, projectId, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-materials', projectId],
      })
      queryClient.invalidateQueries({ queryKey: ['co2-summary', projectId] })
      toast.success('Faktura lastet opp')
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Kunne ikke laste opp faktura',
      )
    },
  })
}

export function useDeleteInvoice(projectId: number) {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invoiceId: number) => {
      const token = await getToken()
      if (!token) throw new Error('Ikke autentisert')
      return deleteInvoice(invoiceId, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-materials', projectId],
      })
      queryClient.invalidateQueries({ queryKey: ['co2-summary', projectId] })
      toast.success('Faktura slettet')
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Kunne ikke slette faktura',
      )
    },
  })
}
