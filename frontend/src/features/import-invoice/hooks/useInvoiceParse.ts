import { useFileParse } from '@/widgets/file-upload/useFileParse'
import { parseInvoiceFile } from '@/entities/materials/api'

export function useInvoiceParse() {
  return useFileParse({
    parseFn: parseInvoiceFile,
    successMessage: 'Faktura analysert',
    fallbackError: 'Kunne ikke analysere faktura',
  })
}
