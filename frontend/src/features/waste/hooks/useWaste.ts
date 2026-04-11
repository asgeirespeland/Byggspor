import { useState } from 'react'

import { useAuthMutation } from '@/shared/hooks/useAuthMutation'
import { useAuthQuery } from '@/shared/hooks/useAuthQuery'

import {
  createManualWaste,
  getProjectWaste,
  parseWasteReport,
} from '../api/waste'
import type { CreateManualWastePayload } from '../types/waste'

type WasteParseResult = {
  items: unknown[]
  fileName: string
}

export function useProjectWaste(projectId: number) {
  return useAuthQuery(['project-waste', projectId], (token) =>
    getProjectWaste(projectId, token),
  )
}

export function useCreateManualWaste(projectId: number) {
  return useAuthMutation<CreateManualWastePayload>({
    mutationFn: (input, token) => createManualWaste(input, token),
    invalidateKeys: [
      ['project-waste', projectId],
      ['co2-summary', projectId],
    ],
    successMessage: 'Avfallsdata lagret',
    errorMessage: 'Kunne ikke lagre avfallsdata',
  })
}

export function useParseWasteReport(projectId: number) {
  const [data, setData] = useState<WasteParseResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mutation = useAuthMutation<File>({
    mutationFn: (file, token) => parseWasteReport(projectId, file, token),
    invalidateKeys: [
      ['project-waste', projectId],
      ['co2-summary', projectId],
    ],
    successMessage: 'Avfallsrapport lastet opp',
    errorMessage: 'Kunne ikke laste opp avfallsrapport',
  })

  async function parse(file: File): Promise<void> {
    setError(null)

    try {
      const items = (await mutation.mutateAsync(file)) as unknown[]
      setData({
        items,
        fileName: file.name,
      })
    } catch (err) {
      setData(null)
      setError(
        err instanceof Error
          ? err.message
          : 'Kunne ikke laste opp avfallsrapport.',
      )
      throw err
    }
  }

  function reset() {
    setData(null)
    setError(null)
    mutation.reset()
  }

  return {
    parse,
    reset,
    data,
    loading: mutation.isPending,
    error,
  }
}
