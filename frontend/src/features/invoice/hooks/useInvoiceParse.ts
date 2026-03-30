import { useFileParse } from '@/shared/hooks/useFileParse'
import { parseInvoiceFile } from '../api/invoice'

export function useInvoiceParse() {
  return useFileParse({
    parseFn: parseInvoiceFile,
    successMessage: 'Faktura analysert',
    fallbackError: 'Kunne ikke analysere faktura',
  })
}
