import { useFileParse } from '@/widgets/file-upload'
import { parseInvoiceFile } from '@/entities/materials'

export function useInvoiceParse() {
  return useFileParse({
    parseFn: parseInvoiceFile,
    successMessage: 'Faktura analysert',
    fallbackError: 'Kunne ikke analysere faktura',
  })
}
