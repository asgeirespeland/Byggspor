import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import ErrorMessage from '@/shared/components/ErrorMessage'
import InlineUndoBar from '@/shared/components/InlineUndoBar'
import FileDropZone from '@/shared/components/FileDropZone'
import SelectedFileBar from '@/shared/components/SelectedFileBar'
import { useFileSelect } from '@/shared/hooks/useFileSelect'
import { useDeferredLoading } from '@/shared/hooks/useDeferredLoading'
import { useRequireToken } from '@/shared/hooks/useRequireToken'
import { confirmInvoice } from '../api/invoice'
import { useInvoiceParse } from '../hooks/useInvoiceParse'
import {
  useProjectMaterials,
  useDeleteInvoice,
} from '../hooks/useProjectMaterials'
import InvoicePreviewTable from './InvoicePreviewTable'
import InvoiceGroupCard from './InvoiceGroupCard'

interface Props {
  projectId: number
}

export default function InvoiceUpload({ projectId }: Props) {
  const queryClient = useQueryClient()
  const { authReady, requireToken } = useRequireToken()
  const { parse, reset, data, loading, error } = useInvoiceParse()
  const { selectedFile, fileError, acceptFile, clear } = useFileSelect({
    errorMessage: 'Filen må være i XML-format.',
    onClear: reset,
  })

  const { data: invoiceGroups, isLoading } = useProjectMaterials(projectId)
  const showLoading = useDeferredLoading(isLoading)
  const { deleteInvoice, pendingInvoiceId, undoInvoiceDelete } =
    useDeleteInvoice(projectId)
  const [confirming, setConfirming] = useState(false)

  const handleParse = async () => {
    if (!selectedFile || !authReady) return
    const token = await requireToken()
    await parse(selectedFile, token)
  }

  const handleConfirm = async (
    overrides: Record<string, { total_co2_kg: number }>,
  ) => {
    if (!data) return
    setConfirming(true)
    try {
      const token = await requireToken()
      await confirmInvoice(projectId, data, overrides, token)
      queryClient.invalidateQueries({
        queryKey: ['project-materials', projectId],
      })
      queryClient.invalidateQueries({ queryKey: ['co2-summary', projectId] })
      clear()
      toast.success('Faktura bekreftet og lagret')
    } catch {
      toast.error('Kunne ikke lagre fakturaen')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Materialfaktura
        </h3>
        <p className="mt-0.5 text-sm text-gray-500">
          Last opp EHF-fakturaer for å se materialer med NOBB-data og
          EPD-status. Du kan korrigere CO₂-verdier før du bekrefter.
        </p>
      </div>

      {!selectedFile && !data && (
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

      {selectedFile && !data && (
        <SelectedFileBar
          file={selectedFile}
          actionLabel="Analyser"
          loadingLabel="Analyserer…"
          isLoading={loading}
          onAction={handleParse}
          onClear={clear}
        />
      )}

      <ErrorMessage error={error} fallback="Kunne ikke analysere faktura" />

      {data && (
        <>
          <InvoicePreviewTable
            data={data}
            onConfirm={handleConfirm}
            confirming={confirming}
            onCancel={clear}
          />
          <div className="text-center">
            <button
              onClick={clear}
              className="text-sm text-gray-400 hover:text-gray-600 underline"
            >
              Last opp ny fil
            </button>
          </div>
        </>
      )}

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
              projectId={projectId}
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
