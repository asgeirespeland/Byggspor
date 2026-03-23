import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/react'
import { toast } from 'sonner'

import {
  listProjectTransports,
  deleteTransportReport,
  deleteTrip,
  updateTrip,
  type ProjectReportGroup,
  type TripUpdateInput,
} from '../api/projectTransports'

export function useProjectTransports(projectId: number) {
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['project-transports', projectId],
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('Ikke autentisert')
      return listProjectTransports(projectId, token)
    },
  })
}

export function useDeleteTransportReport(projectId: number) {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return async (reportId: number) => {
    const token = await getToken()
    if (!token) {
      toast.error('Ikke autentisert')
      return
    }

    const snapshot = queryClient.getQueryData<ProjectReportGroup[]>([
      'project-transports',
      projectId,
    ])
    queryClient.setQueryData<ProjectReportGroup[]>(
      ['project-transports', projectId],
      (old) => old?.filter((g) => g.report_id !== reportId) ?? [],
    )

    let undone = false
    let called = false
    const fire = async () => {
      if (undone || called) return
      called = true
      try {
        await deleteTransportReport(reportId, token)
        queryClient.invalidateQueries({ queryKey: ['co2-summary', projectId] })
      } catch (err) {
        if (snapshot)
          queryClient.setQueryData(['project-transports', projectId], snapshot)
        toast.error(
          err instanceof Error ? err.message : 'Kunne ikke slette kjørerapport',
        )
      }
    }

    toast.success('Kjørerapport slettet', {
      action: {
        label: 'Angre',
        onClick: () => {
          undone = true
          if (snapshot)
            queryClient.setQueryData(
              ['project-transports', projectId],
              snapshot,
            )
        },
      },
      onAutoClose: fire,
      onDismiss: fire,
    })
  }
}

export function useDeleteTrip(projectId: number) {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return async (tripId: number) => {
    const token = await getToken()
    if (!token) {
      toast.error('Ikke autentisert')
      return
    }

    const snapshot = queryClient.getQueryData<ProjectReportGroup[]>([
      'project-transports',
      projectId,
    ])
    queryClient.setQueryData<ProjectReportGroup[]>(
      ['project-transports', projectId],
      (old) =>
        old?.map((g) => ({
          ...g,
          trips: g.trips.filter((t) => t.id !== tripId),
        })) ?? [],
    )

    let undone = false
    let called = false
    const fire = async () => {
      if (undone || called) return
      called = true
      try {
        await deleteTrip(tripId, token)
        queryClient.invalidateQueries({ queryKey: ['co2-summary', projectId] })
      } catch (err) {
        if (snapshot)
          queryClient.setQueryData(['project-transports', projectId], snapshot)
        toast.error(
          err instanceof Error ? err.message : 'Kunne ikke slette tur',
        )
      }
    }

    toast.success('Tur slettet', {
      action: {
        label: 'Angre',
        onClick: () => {
          undone = true
          if (snapshot)
            queryClient.setQueryData(
              ['project-transports', projectId],
              snapshot,
            )
        },
      },
      onAutoClose: fire,
      onDismiss: fire,
    })
  }
}

export function useUpdateTrip(projectId: number) {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      tripId,
      data,
    }: {
      tripId: number
      data: TripUpdateInput
    }) => {
      const token = await getToken()
      if (!token) throw new Error('Ikke autentisert')
      return updateTrip(tripId, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-transports', projectId],
      })
      queryClient.invalidateQueries({ queryKey: ['co2-summary', projectId] })
      toast.success('Tur oppdatert')
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Kunne ikke oppdatere tur',
      )
    },
  })
}
