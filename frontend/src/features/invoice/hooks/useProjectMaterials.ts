import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/react'
import { toast } from 'sonner'

import {
  listProjectMaterials,
  deleteInvoice,
  updateMaterial,
  type ProjectInvoiceGroup,
} from '../api/invoice'
import { useOptimisticDelete } from '@/shared/hooks/useOptimisticDelete'

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

export function useUpdateMaterial(projectId: number) {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      materialId,
      total_co2_kg,
    }: {
      materialId: number
      total_co2_kg: number
    }) => {
      const token = await getToken()
      if (!token) throw new Error('Ikke autentisert')
      return updateMaterial(materialId, { total_co2_kg }, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-materials', projectId],
      })
      queryClient.invalidateQueries({ queryKey: ['co2-summary', projectId] })
      toast.success('CO₂-verdi oppdatert')
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Kunne ikke oppdatere materialposten',
      )
    },
  })
}

export function useDeleteInvoice(projectId: number) {
  const { handleDelete, pendingId, undo } = useOptimisticDelete<
    ProjectInvoiceGroup[]
  >({
    projectId,
    listQueryKey: ['project-materials', projectId],
    co2Category: 'materials',
    prepare: (snapshot, id) => {
      const group = snapshot?.find((g) => g.invoice_id === id)
      return {
        updatedList: snapshot?.filter((g) => g.invoice_id !== id) ?? [],
        co2Delta:
          group?.items.reduce(
            (sum, item) => sum + (item.total_co2_kg ?? 0),
            0,
          ) ?? 0,
        entryCountDelta: group?.items.length ?? 0,
      }
    },
    deleteFn: deleteInvoice,
    errorMessage: 'Kunne ikke slette faktura',
  })

  return {
    deleteInvoice: handleDelete,
    pendingInvoiceId: pendingId,
    undoInvoiceDelete: undo,
  }
}
