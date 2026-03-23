import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/react'

import {
  calculateEnergy,
  listEnergies,
  deleteEnergy,
  updateEnergy,
  listPriceZones,
} from '../api/energy'
import type { EnergyCalculateInput, EnergyUpdateInput } from '../types/energy'

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
    },
  })
}

export function useDeleteEnergy(projectId: number) {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (energyId: number) => {
      const token = await getToken()
      if (!token) throw new Error('Ikke autentisert')
      return deleteEnergy(energyId, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energies', projectId] })
    },
  })
}
