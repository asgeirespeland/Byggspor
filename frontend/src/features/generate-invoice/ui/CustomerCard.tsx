import { ChevronDown, Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { CustomerFields, InvoiceDraft } from '../hooks/useInvoiceDraft'

interface Props {
  customer: CustomerFields
  setCustomer: InvoiceDraft['setCustomer']
}

export default function CustomerCard({ customer, setCustomer }: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
      <h2 className="text-base font-semibold text-gray-900">Kunde</h2>

      <div className="space-y-1.5">
        <Label className="text-xs text-gray-600">Kunde</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="Velg kontakt"
            value={customer.customerName}
            onChange={(e) => setCustomer('customerName', e.target.value)}
            className="pl-8 pr-8"
          />
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        {!customer.customerName && (
          <span className="inline-block text-xs bg-danger text-white rounded px-1.5 py-0.5">
            Påkrevd
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-600">Vår referanse</Label>
          <Input
            placeholder="Referanse (ikke påkrevd)"
            value={customer.ourReference}
            onChange={(e) => setCustomer('ourReference', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-600">Deres referanse</Label>
          <Input
            placeholder="Referanse (ikke påkrevd)"
            value={customer.theirReference}
            onChange={(e) => setCustomer('theirReference', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-gray-600">Ordrereferanse</Label>
        <Input
          placeholder="Referanse (ikke påkrevd)"
          value={customer.orderReference}
          onChange={(e) => setCustomer('orderReference', e.target.value)}
        />
      </div>

      <div className="flex justify-end pt-1">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Legg til flere kunder
        </Button>
      </div>
    </div>
  )
}
