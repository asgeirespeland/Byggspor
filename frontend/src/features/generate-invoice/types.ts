export type InvoiceFormat = 'aggregated' | 'detailed'

export interface InvoiceLineInput {
  description: string
  quantity: number
  unit: string
  unit_price_kr: number
  discount_percent: number
}

export interface GenerateInvoiceInput {
  format_type: InvoiceFormat
  invoice_number?: string
  due_date?: string
  our_reference?: string
  their_reference?: string
  bank_account?: string
  customer_name?: string
  customer_org_number?: string
  customer_address?: string
  customer_email?: string
  supplier?: {
    name?: string
    org_number?: string
    address?: string
    email?: string
  }
  line_items?: InvoiceLineInput[]
}

export interface GeneratedInvoice {
  id: number
  project_id: number
  format_type: InvoiceFormat
  invoice_number: string | null
  due_date: string | null
  our_reference: string | null
  their_reference: string | null
  bank_account: string | null
  customer_name: string | null
  customer_org_number: string | null
  customer_address: string | null
  customer_email: string | null
  total_amount_kr: number | null
  vat_total_kr: number | null
  grand_total_kr: number | null
  total_co2_kg: number | null
  total_materials_co2_kg: number | null
  total_transport_co2_kg: number | null
  total_waste_co2_kg: number | null
  total_energy_co2_kg: number | null
  ehf_xml_path: string | null
  generated_at: string | null
}
