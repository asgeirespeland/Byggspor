import { useAuthQuery } from '@/shared/hooks/useAuthQuery'
import { useAuthMutation } from '@/shared/hooks/useAuthMutation'
import { useOptimisticDelete } from '@/shared/hooks/useOptimisticDelete'

import {
  listProjectMaterials,
  deleteInvoice,
  updateMaterial,
  type ProjectInvoiceGroup,
} from '../api/invoice'

export function useProjectMaterials(projectId: number) {
  return useAuthQuery(['project-materials', projectId], (token) =>
    listProjectMaterials(projectId, token),
  )
}

export function useUpdateMaterial(projectId: number) {
  return useAuthMutation<{ materialId: number; total_co2_kg: number }, unknown>(
    {
      mutationFn: ({ materialId, total_co2_kg }, token) =>
        updateMaterial(materialId, { total_co2_kg }, token),
      invalidateKeys: [
        ['project-materials', projectId],
        ['co2-summary', projectId],
      ],
      successMessage: 'CO₂-verdi oppdatert',
      errorMessage: 'Kunne ikke oppdatere materialposten',
    },
  )
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
