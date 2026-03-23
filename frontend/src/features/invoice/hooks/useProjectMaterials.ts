import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/react'

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
    },
  })
}
