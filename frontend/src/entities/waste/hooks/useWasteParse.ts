import { useFileParse } from '@/widgets/file-upload/useFileParse'
import { parseWasteFile } from '../api'

export function useWasteParse() {
  return useFileParse({
    parseFn: parseWasteFile,
    successMessage: 'Avfallsrapport analysert',
    fallbackError: 'Kunne ikke analysere avfallsrapport',
  })
}
