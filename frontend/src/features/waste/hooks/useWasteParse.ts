import { useFileParse } from '@/shared/hooks/useFileParse'
import { parseWasteFile } from '../api/waste'

export function useWasteParse() {
  return useFileParse({
    parseFn: parseWasteFile,
    successMessage: 'Avfallsrapport analysert',
    fallbackError: 'Kunne ikke analysere avfallsrapport',
  })
}
