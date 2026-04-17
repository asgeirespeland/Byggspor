import { useFileParse } from '@/widgets/file-upload/useFileParse'
import { parseTransportFile } from '../api/transport'

export function useTransportParse() {
  return useFileParse({
    parseFn: parseTransportFile,
    successMessage: 'Transportfil analysert',
    fallbackError: 'Kunne ikke analysere transportfil',
  })
}
