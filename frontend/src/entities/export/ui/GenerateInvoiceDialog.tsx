/**
 * Generate-invoice dialog: orchestrates InvoiceDetailsCard, CustomerCard,
 * LineItemsTable, AttachmentsPanel, and the footer actions. State lives in
 * useInvoiceDraft (form fields) + useProjectLineItems (rows); useGenerateInvoice
 * handles submit.
 */
import { FileDown, Loader2 } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Project } from '@/entities/project/hooks/useProjects'
import { useGenerateInvoice } from '../hooks/useGenerateInvoice'
import { useDownloadPdf } from '../hooks/useDownloadPdf'
import { useProjectLineItems } from '../hooks/useProjectLineItems'
import { useInvoiceDraft } from '../hooks/useInvoiceDraft'
import type { GeneratedInvoice } from '../types'
import InvoiceDetailsCard from './InvoiceDetailsCard'
import CustomerCard from './CustomerCard'
import LineItemsTable from './LineItemsTable'
import AttachmentsPanel from './AttachmentsPanel'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project
}

export default function GenerateInvoiceDialog({
  open,
  onOpenChange,
  project,
}: Props) {
  const { generate, isPending, error } = useGenerateInvoice()
  const { downloadPdf, isPending: pdfIsPending } = useDownloadPdf()
  const { lineItems, isLoading, updateLineItem, removeLineItem, addLine } =
    useProjectLineItems(project.id, open)
  const { invoice, customer, setInvoice, setCustomer, buildPayload } =
    useInvoiceDraft(project)
  const [generatedInvoice, setGeneratedInvoice] =
    useState<GeneratedInvoice | null>(null)

  async function handleGenerate() {
    const inv = await generate(project.id, buildPayload(lineItems))
    if (inv) setGeneratedInvoice(inv)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[95vw] max-h-[95vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="flex flex-row items-center px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <DialogTitle className="text-base font-semibold text-gray-900">
              Generer EHF-faktura
            </DialogTitle>
            <p className="text-xs text-gray-400 mt-0.5">{project.name}</p>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <InvoiceDetailsCard invoice={invoice} setInvoice={setInvoice} />
            <CustomerCard customer={customer} setCustomer={setCustomer} />
          </div>

          <LineItemsTable
            lineItems={lineItems}
            isLoading={isLoading}
            updateLineItem={updateLineItem}
            removeLineItem={removeLineItem}
            addLine={addLine}
          />

          <AttachmentsPanel />

          {error && (
            <p className="rounded-lg bg-danger-soft px-4 py-2.5 text-sm text-danger-strong">
              {error}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={isPending}>
              Lagre utkast
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              className="text-danger hover:text-danger-strong hover:border-danger/30"
            >
              Slett utkast
            </Button>
            <button
              className="text-sm text-info-strong hover:underline ml-1"
              onClick={() => onOpenChange(false)}
            >
              Fakturaoversikten
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={isPending}>
              Forhåndsvisning
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!generatedInvoice || pdfIsPending}
              onClick={() =>
                generatedInvoice && downloadPdf(generatedInvoice.id)
              }
              className="gap-2"
            >
              {pdfIsPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              Last ned PDF
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isPending}
              className="gap-2 bg-success hover:bg-success-strong text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Genererer…
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  Opprett faktura
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
