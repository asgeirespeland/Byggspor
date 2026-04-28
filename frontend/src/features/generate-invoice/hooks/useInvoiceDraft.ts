import { useState } from 'react'
import type { Project } from '@/entities/project'
import type { OrgDto } from '@/entities/organization'
import type { GenerateInvoiceInput } from '../types'
import type { LineItem } from './useProjectLineItems'

export interface InvoiceFields {
  daysUntilDue: number
  bankAccount: string
  comment: string
}

export interface CustomerFields {
  customerName: string
  ourReference: string
  theirReference: string
  orderReference: string
}

export interface InvoiceDraft {
  invoice: InvoiceFields
  customer: CustomerFields
  setInvoice: <K extends keyof InvoiceFields>(
    key: K,
    value: InvoiceFields[K],
  ) => void
  setCustomer: <K extends keyof CustomerFields>(
    key: K,
    value: CustomerFields[K],
  ) => void
  buildPayload: (lineItems: LineItem[]) => GenerateInvoiceInput
}

export function useInvoiceDraft(
  project: Project,
  org?: OrgDto | null,
): InvoiceDraft {
  const [invoice, setInvoiceState] = useState<InvoiceFields>({
    daysUntilDue: 14,
    bankAccount: org?.account_number ?? '',
    comment: '',
  })
  const [customer, setCustomerState] = useState<CustomerFields>({
    customerName: project.customer_name ?? '',
    ourReference: '',
    theirReference: '',
    orderReference: '',
  })

  const setInvoice: InvoiceDraft['setInvoice'] = (key, value) =>
    setInvoiceState((prev) => ({ ...prev, [key]: value }))

  const setCustomer: InvoiceDraft['setCustomer'] = (key, value) =>
    setCustomerState((prev) => ({ ...prev, [key]: value }))

  function buildPayload(lineItems: LineItem[]): GenerateInvoiceInput {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + invoice.daysUntilDue)

    return {
      format_type: 'aggregated',
      due_date: dueDate.toISOString().split('T')[0],
      bank_account: invoice.bankAccount || undefined,
      our_reference: customer.ourReference || undefined,
      their_reference: customer.theirReference || undefined,
      customer_name: customer.customerName || undefined,
      supplier: org
        ? {
            name: org.name,
            org_number: org.org_number ?? undefined,
            address: org.address ?? undefined,
            email: org.email ?? undefined,
          }
        : undefined,
      line_items: lineItems
        .filter((item) => item.description.trim() !== '')
        .map((item) => ({
          description: item.description,
          quantity: parseFloat(item.quantity) || 1,
          unit: item.unit,
          unit_price_kr: parseFloat(item.price) || 0,
          discount_percent: parseFloat(item.discount) || 0,
        })),
    }
  }

  return { invoice, customer, setInvoice, setCustomer, buildPayload }
}
