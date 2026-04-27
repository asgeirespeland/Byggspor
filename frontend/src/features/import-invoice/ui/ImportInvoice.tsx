/**
 * EHF invoice import flow: upload → parse → preview → confirm.
 * Wraps FileUploadShell around useInvoiceParse, renders InvoicePreview on success,
 * posts confirmInvoice on user confirm and invalidates materials/report queries.
 */
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FileUploadShell } from '@/widgets/file-upload'
import { qk } from '@/shared/api/queryKeys'
import { confirmInvoice } from '@/entities/materials'
import { useInvoiceParse } from '../hooks/useInvoiceParse'
import InvoicePreview from './InvoicePreview'

interface Props {
  projectId: number
}

export default function ImportInvoice({ projectId }: Props) {
  const queryClient = useQueryClient()
  const { parse, reset, data, setData, loading, error } = useInvoiceParse()
  const [confirming, setConfirming] = useState(false)

  return (
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
                queryKey: qk.materials(projectId),
              })
              queryClient.invalidateQueries({
                queryKey: qk.co2Summary(projectId),
              })
              queryClient.invalidateQueries({
                queryKey: qk.detailedReport(projectId),
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
  )
}
