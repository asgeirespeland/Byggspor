import { ChevronDown, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { todayFormatted } from '../lib/invoiceHelpers'
import type { InvoiceFields, InvoiceDraft } from '../hooks/useInvoiceDraft'

interface Props {
  invoice: InvoiceFields
  setInvoice: InvoiceDraft['setInvoice']
}

export default function InvoiceDetailsCard({ invoice, setInvoice }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <h2 className="text-base font-semibold text-foreground">Faktura</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Dager til forfall
          </Label>
          <Input
            type="number"
            min={0}
            value={invoice.daysUntilDue}
            onChange={(e) => setInvoice('daysUntilDue', Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Dato</Label>
          <div className="flex items-center h-9 px-3 rounded-md border border-border bg-muted/50 text-sm text-muted-foreground">
            {todayFormatted()}
            <span className="ml-1 text-xs text-info-strong cursor-pointer">
              (endre)
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          Kontonummer{' '}
          <span className="text-info-strong cursor-pointer">
            endre standard
          </span>
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={invoice.bankAccount}
              onChange={(e) => setInvoice('bankAccount', e.target.value)}
              className="pr-8"
            />
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
          <Button variant="outline" size="icon" className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {!invoice.bankAccount && (
          <span className="inline-block text-xs bg-danger text-white rounded px-1.5 py-0.5">
            Påkrevd
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          Kommentar{' '}
          <span className="text-info-strong cursor-pointer">
            endre standard
          </span>
        </Label>
        <Textarea
          value={invoice.comment}
          onChange={(e) => setInvoice('comment', e.target.value)}
          className="min-h-[80px] resize-y"
        />
      </div>
    </div>
  )
}
