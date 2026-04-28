/**
 * Post-upload edit/delete mutations for materials.
 * useUpdateMaterial, useDeleteInvoice (whole parsed invoice), useDeleteMaterial (single row).
 */
import { useAuthMutation } from '@/shared/auth/useAuthMutation'
import { qk, projectReportKeys } from '@/shared/api/queryKeys'

import {
  deleteMaterial,
  deleteInvoice,
  updateMaterial,
  type ProjectInvoiceGroup,
  type ProjectMaterialItem,
} from '@/entities/materials'

import { useGroupDelete } from './useGroupDelete'
import { useItemDelete } from './useItemDelete'

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
  const { handleDelete, pendingId, undo } = useGroupDelete<
    ProjectInvoiceGroup,
    ProjectMaterialItem
  >({
    projectId,
    listQueryKey: qk.materials(projectId),
    co2Category: 'materials',
    matchBy: (g) => g.invoice_id,
    itemsOf: (g) => g.items,
    co2Of: (item) => item.total_co2_kg ?? 0,
    deleteFn: deleteInvoice,
    successMessage: 'Faktura slettet',
    errorMessage: 'Kunne ikke slette faktura',
  })

  return {
    deleteInvoice: handleDelete,
    pendingInvoiceId: pendingId,
    undoInvoiceDelete: undo,
  }
}

export function useDeleteMaterial(projectId: number) {
  const { handleDelete, pendingId, undo } = useItemDelete<
    ProjectInvoiceGroup,
    ProjectMaterialItem
  >({
    projectId,
    listQueryKey: qk.materials(projectId),
    co2Category: 'materials',
    groupIdOf: (g) => g.invoice_id,
    itemsOf: (g) => g.items,
    setItems: (g, items) => ({ ...g, items }),
    idOf: (item) => item.id,
    co2Of: (item) => item.total_co2_kg ?? 0,
    deleteFn: deleteMaterial,
    successMessage: 'Materialpost slettet',
    errorMessage: 'Kunne ikke slette materialposten',
  })

  return {
    deleteMaterial: handleDelete,
    pendingMaterialId: pendingId,
    undoMaterialDelete: undo,
  }
}
