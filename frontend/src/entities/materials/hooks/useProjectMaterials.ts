/**
 * React Query hooks for the materials tab.
 * Exports: useProjectMaterials (list), useUpdateMaterial,
 * useDeleteInvoice (optimistic delete of full invoice), useDeleteMaterial
 * (optimistic delete of a single row). Both deletes use features/inline-edit/useOptimisticDelete
 * with co2Category 'materials' so global KPIs update optimistically.
 */
import { useAuthQuery } from '@/shared/auth/useAuthQuery'
import { useAuthMutation } from '@/shared/auth/useAuthMutation'
import { useOptimisticDelete } from '@/widgets/data-table/useOptimisticDelete'
import { sumBy } from '@/shared/utils/collections'
import { qk, projectReportKeys } from '@/shared/api/queryKeys'

import {
  listProjectMaterials,
  deleteMaterial,
  deleteInvoice,
  updateMaterial,
  type ProjectInvoiceGroup,
} from '../api'

export function useProjectMaterials(projectId: number) {
  return useAuthQuery(qk.materials(projectId), (token) =>
    listProjectMaterials(projectId, token),
  )
}

export function useUpdateMaterial(projectId: number) {
  return useAuthMutation<{ materialId: number; total_co2_kg: number }, unknown>(
    {
      mutationFn: ({ materialId, total_co2_kg }, token) =>
        updateMaterial(materialId, { total_co2_kg }, token),
      invalidateKeys: [
        qk.materials(projectId),
        ...projectReportKeys(projectId),
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
    listQueryKey: qk.materials(projectId),
    co2Category: 'materials',
    prepare: (snapshot, id) => {
      const group = snapshot?.find((g) => g.invoice_id === id)
      return {
        updatedList: snapshot?.filter((g) => g.invoice_id !== id) ?? [],
        co2Delta: sumBy(group?.items ?? [], (item) => item.total_co2_kg),
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

export function useDeleteMaterial(projectId: number) {
  const { handleDelete, pendingId, undo } = useOptimisticDelete<
    ProjectInvoiceGroup[]
  >({
    projectId,
    listQueryKey: qk.materials(projectId),
    co2Category: 'materials',
    prepare: (snapshot, materialId) => {
      const item = snapshot
        ?.flatMap((g) => g.items)
        .find((i) => i.id === materialId)
      return {
        updatedList:
          snapshot
            ?.map((g) => ({
              ...g,
              items: g.items.filter((i) => i.id !== materialId),
            }))
            .filter((g) => g.items.length > 0) ?? [],
        co2Delta: item?.total_co2_kg ?? 0,
        entryCountDelta: 1,
      }
    },
    deleteFn: deleteMaterial,
    errorMessage: 'Kunne ikke slette materialposten',
  })

  return {
    deleteMaterial: handleDelete,
    pendingMaterialId: pendingId,
    undoMaterialDelete: undo,
  }
}
