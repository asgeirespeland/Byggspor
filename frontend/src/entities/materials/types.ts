export interface Address {
  street: string | null
  city: string | null
  postal_zone: string | null
  country: string | null
}

export interface Party {
  name: string | null
  legal_name: string | null
  org_number: string | null
  address: Address | null
}

export interface GwpStage {
  total: number | null
  fossil: number | null
  biogenic: number | null
}

export interface EpdData {
  epd_number: string | null
  declared_unit: string | null
  conversion_factor_kg: number | null
  price_unit_factor: number | null
  reference_service_life: string | null
  gwp_stages: Record<string, GwpStage>
}

export interface NobbData {
  nobb_number: string
  name: string | null
  secondary_text: string | null
  description: string | null
  product_group: string | null
  product_group_number: string | null
  environment_labels: string[]
  has_epd: boolean
  epd: EpdData | null
}

export interface LineItem {
  line_number: string | null
  name: string | null
  seller_item_id: string | null
  gtin: string | null
  nobb_number: string | null
  quantity: number | null
  unit: string | null
  price_per_unit: number | null
  line_total: number | null
  flagged: boolean
  enriched: boolean
  nobb_data: NobbData | null
}

export interface InvoiceResponse {
  invoice_number: string | null
  issue_date: string | null
  currency: string | null
  supplier: Party | null
  buyer: Party | null
  line_items: LineItem[]
}
