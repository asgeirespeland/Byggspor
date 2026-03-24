import ErrorMessage from '@/shared/components/ErrorMessage'
import InlineUndoBar from '@/shared/components/InlineUndoBar'
import FileDropZone from '@/shared/components/FileDropZone'
import SelectedFileBar from '@/shared/components/SelectedFileBar'
import { useFileSelect } from '@/shared/hooks/useFileSelect'
import { useDeferredLoading } from '@/shared/hooks/useDeferredLoading'
import {
  useUploadInvoice,
  useProjectMaterials,
  useDeleteInvoice,
} from '../hooks/useProjectMaterials'
import InvoiceGroupCard from './InvoiceGroupCard'

interface Props {
  projectId: number
}

export default function InvoiceUpload({ projectId }: Props) {
  const { selectedFile, fileError, acceptFile, clear } = useFileSelect({
    errorMessage: 'Filen må være i XML-format.',
  })

  const uploadMutation = useUploadInvoice(projectId)
  const { data: invoiceGroups, isLoading } = useProjectMaterials(projectId)
  const showLoading = useDeferredLoading(isLoading)
  const { deleteInvoice, pendingInvoiceId, undoInvoiceDelete } =
    useDeleteInvoice(projectId)

  const handleUpload = () => {
    if (!selectedFile) return
    uploadMutation.mutate(selectedFile, { onSuccess: clear })
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Materialfaktura
        </h3>
        <p className="mt-0.5 text-sm text-gray-500">
          Last opp EHF-fakturaer for å se materialer med NOBB-data og
          EPD-status.
        </p>
      </div>

      {!selectedFile && (
        <FileDropZone
          accept=".xml"
          description="Dra og slipp filen din her"
          onDrop={acceptFile}
        />
      )}

      {fileError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {fileError}
        </p>
      )}

      {selectedFile && (
        <SelectedFileBar
          file={selectedFile}
          actionLabel="Last opp"
          loadingLabel="Laster opp…"
          isLoading={uploadMutation.isPending}
          onAction={handleUpload}
          onClear={clear}
        />
      )}

      <ErrorMessage
        error={uploadMutation.error}
        fallback="Kunne ikke laste opp faktura"
      />

      {showLoading && (
        <p className="text-sm text-gray-400 text-center py-4">
          Laster materialer…
        </p>
      )}

      {(invoiceGroups && invoiceGroups.length > 0) ||
      pendingInvoiceId != null ? (
        <div className="space-y-3">
          {invoiceGroups && invoiceGroups.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Opplastede fakturaer ({invoiceGroups.length})
            </p>
          )}
          {invoiceGroups?.map((group) => (
            <InvoiceGroupCard
              key={group.invoice_id}
              group={group}
              onDelete={() => {
                if (group.invoice_id != null)
                  void deleteInvoice(group.invoice_id)
              }}
              isDeleting={false}
            />
          ))}
          {pendingInvoiceId != null && (
            <InlineUndoBar
              message="Faktura slettet"
              onUndo={undoInvoiceDelete}
            />
          )}
        </div>
      ) : null}
    </div>
  )
}
