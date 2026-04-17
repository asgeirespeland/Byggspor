/**
 * Materials tab composer: DataTabShell wrapping upload → parse → preview → confirm,
 * then a list of InvoiceGroupCards with optimistic delete/undo. Manual-entry form
 * is a placeholder. Bridges file-upload feature, inline-edit feature, and the
 * materials entity hooks.
 */
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import InlineUndoBar from '@/features/inline-edit/InlineUndoBar'
import FileUploadShell from '@/features/file-upload/FileUploadShell'
import DataTabShell from '@/widgets/DataTabShell'
import { confirmInvoice } from '../api'
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
  const { deleteInvoice, pendingInvoiceId, undoInvoiceDelete } =
    useDeleteInvoice(projectId)
  const [confirming, setConfirming] = useState(false)

  return (
    <DataTabShell
      upload={
        <FileUploadShell
          title="Materialfaktura"
          description="Last opp EHF-fakturaer for å se materialer med NOBB-data og EPD-status. Du kan korrigere CO₂-verdier før du bekrefter."
          accept=".xml"
          dropDescription="Dra og slipp materialfakturaen din her"
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
                  queryClient.invalidateQueries({
                    queryKey: ['detailed-report', projectId],
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
      }
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
