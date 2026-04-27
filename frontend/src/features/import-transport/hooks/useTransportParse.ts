import { useFileParse } from '@/widgets/file-upload'
import { parseTransportFile } from '@/entities/transport'

export function useTransportParse() {
  return useFileParse({
    parseFn: parseTransportFile,
    successMessage: 'Transportfil analysert',
    fallbackError: 'Kunne ikke analysere transportfil',
  })
}
