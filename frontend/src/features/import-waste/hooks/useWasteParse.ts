import { useFileParse } from '@/widgets/file-upload'
import { parseWasteFile } from '@/entities/waste'

export function useWasteParse() {
  return useFileParse({
    parseFn: parseWasteFile,
    successMessage: 'Avfallsrapport analysert',
    fallbackError: 'Kunne ikke analysere avfallsrapport',
  })
}
