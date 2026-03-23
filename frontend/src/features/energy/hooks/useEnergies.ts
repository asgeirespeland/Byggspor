import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/react'
import { toast } from 'sonner'

import {
  calculateEnergy,
  listEnergies,
  deleteEnergy,
  updateEnergy,
  listPriceZones,
} from '../api/energy'
import type {
  EnergyCalculateInput,
  EnergyEntry,
  EnergyUpdateInput,
} from '../types/energy'

export function useEnergies(projectId: number) {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['energies', projectId],
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('Ikke autentisert')
      return listEnergies(projectId, token)
    },
  })
}

export function usePriceZones() {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['price-zones'],
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('Ikke autentisert')
      return listPriceZones(token)
    },
    staleTime: Infinity,
  })
}

export function useCalculateEnergy(projectId: number) {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: EnergyCalculateInput) => {
      const token = await getToken()
      if (!token) throw new Error('Ikke autentisert')
      return calculateEnergy(input, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energies', projectId] })
      queryClient.invalidateQueries({ queryKey: ['co2-summary', projectId] })
      toast.success('Energidata lagret')
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Kunne ikke lagre energidata',
      )
    },
  })
}

export function useUpdateEnergy(projectId: number) {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      energyId,
      data,
    }: {
      energyId: number
      data: EnergyUpdateInput
    }) => {
      const token = await getToken()
      if (!token) throw new Error('Ikke autentisert')
      return updateEnergy(energyId, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energies', projectId] })
      queryClient.invalidateQueries({ queryKey: ['co2-summary', projectId] })
      toast.success('Energidata oppdatert')
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Kunne ikke oppdatere energidata',
      )
    },
  })
}

export function useDeleteEnergy(projectId: number) {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return async (energyId: number) => {
    const token = await getToken()
    if (!token) {
      toast.error('Ikke autentisert')
      return
    }

    const snapshot = queryClient.getQueryData<EnergyEntry[]>([
      'energies',
      projectId,
    ])
    queryClient.setQueryData<EnergyEntry[]>(
      ['energies', projectId],
      (old) => old?.filter((e) => e.id !== energyId) ?? [],
    )

    let undone = false
    let called = false
    const fire = async () => {
      if (undone || called) return
      called = true
      try {
        await deleteEnergy(energyId, token)
        queryClient.invalidateQueries({ queryKey: ['co2-summary', projectId] })
      } catch (err) {
        if (snapshot)
          queryClient.setQueryData(['energies', projectId], snapshot)
        toast.error(
          err instanceof Error ? err.message : 'Kunne ikke slette energidata',
        )
      }
    }

    toast.success('Energidata slettet', {
      action: {
        label: 'Angre',
        onClick: () => {
          undone = true
          if (snapshot)
            queryClient.setQueryData(['energies', projectId], snapshot)
        },
      },
      onAutoClose: fire,
      onDismiss: fire,
    })
  }
}
