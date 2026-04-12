import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import InlineUndoBar from '@/shared/components/InlineUndoBar'
import FileUploadShell from '@/shared/components/FileUploadShell'
import { useDeferredLoading } from '@/shared/hooks/useDeferredLoading'
import { confirmInvoice } from '../api/invoice'
import { useInvoiceParse } from '../hooks/useInvoiceParse'
import {
  useProjectMaterials,
  useDeleteInvoice,
} from '../hooks/useProjectMaterials'
import InvoicePreview from './InvoicePreview'
import InvoiceGroupCard from './InvoiceGroupCard'

interface Props {
  projectId: number
}

export default function InvoiceUpload({ projectId }: Props) {
  const queryClient = useQueryClient()
  const { parse, reset, data, setData, loading, error } = useInvoiceParse()
  const { data: invoiceGroups, isLoading } = useProjectMaterials(projectId)
  const showLoading = useDeferredLoading(isLoading)
  const { deleteInvoice, pendingInvoiceId, undoInvoiceDelete } =
    useDeleteInvoice(projectId)
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="space-y-4">
      <FileUploadShell
        title="Materialfaktura"
        description="Last opp EHF-fakturaer for å se materialer med NOBB-data og EPD-status. Du kan korrigere CO₂-verdier før du bekrefter."
        accept=".xml"
        dropDescription="Dra og slipp filen din her"
        fileErrorMessage="Filen må være i XML-format."
        parse={parse}
        reset={reset}
        data={data}
        loading={loading}
        error={error}
        errorFallback="Kunne ikke analysere faktura"
      >
        {({ data: invoiceData, clear, requireToken }) => (
          <InvoicePreview
            data={invoiceData}
            setData={setData}
            onConfirm={async () => {
              setConfirming(true)
              try {
                const token = await requireToken()
                await confirmInvoice(projectId, invoiceData, {}, token)
                queryClient.invalidateQueries({
                  queryKey: ['project-materials', projectId],
                })
                queryClient.invalidateQueries({
                  queryKey: ['co2-summary', projectId],
                })
                clear()
                toast.success('Faktura bekreftet og lagret')
              } catch {
                toast.error('Kunne ikke lagre fakturaen')
              } finally {
                setConfirming(false)
              }
            }}
            confirming={confirming}
            onCancel={clear}
          />
        )}
      </FileUploadShell>

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
