/**
 * Materials tab: DataTabShell composition wrapping the import-invoice feature
 * as the upload slot, and a list of InvoiceGroupCards backed by useProjectMaterials.
 * Owns the invoice-level optimistic delete + undo bar via useDeleteInvoice.
 */
import { InlineUndoBar } from '@/widgets/data-table'
import { DataTabShell } from '@/widgets/data-table'
import { useProjectMaterials } from '@/entities/materials'
import { useDeleteInvoice } from '@/features/edit-uploaded-data'
import { ImportInvoice } from '@/features/import-invoice'
import InvoiceGroupCard from './InvoiceGroupCard'

interface Props {
  projectId: number
}

export default function MaterialsTab({ projectId }: Props) {
  const { data: invoiceGroups, isLoading } = useProjectMaterials(projectId)
  const { deleteInvoice, pendingInvoiceId, undoInvoiceDelete } =
    useDeleteInvoice(projectId)

  return (
    <DataTabShell
      upload={<ImportInvoice projectId={projectId} />}
      manualEntryForm={
        <p className="text-sm text-gray-400">
          Manuell registrering av materialer kommer snart.
        </p>
      }
      isLoading={isLoading}
      loadingText="Laster materialer…"
      sectionHeading="Opplastede fakturaer"
      itemCount={invoiceGroups?.length ?? 0}
      undoBar={
        pendingInvoiceId != null ? (
          <InlineUndoBar message="Faktura slettet" onUndo={undoInvoiceDelete} />
        ) : undefined
      }
    >
      {invoiceGroups?.map((group) => (
        <InvoiceGroupCard
          key={group.invoice_id}
          group={group}
          projectId={projectId}
          onDelete={() => {
            if (group.invoice_id != null) void deleteInvoice(group.invoice_id)
          }}
          isDeleting={false}
        />
      ))}
    </DataTabShell>
  )
}
