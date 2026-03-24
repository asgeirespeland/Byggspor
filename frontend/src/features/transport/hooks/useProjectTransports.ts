import { useState } from 'react'
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
import { useOptimisticDelete } from '@/shared/hooks/useOptimisticDelete'

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
  const { handleDelete, pendingId, undo } = useOptimisticDelete<
    ProjectReportGroup[]
  >({
    projectId,
    listQueryKey: ['project-transports', projectId],
    co2Category: 'transport',
    prepare: (snapshot, id) => {
      const trips = snapshot?.find((g) => g.report_id === id)?.trips ?? []
      return {
        updatedList: snapshot?.filter((g) => g.report_id !== id) ?? [],
        co2Delta: trips.reduce((sum, t) => sum + (t.total_co2_kg ?? 0), 0),
        entryCountDelta: trips.length,
      }
    },
    deleteFn: deleteTransportReport,
    errorMessage: 'Kunne ikke slette kjørerapport',
  })

  return {
    deleteReport: handleDelete,
    pendingReportId: pendingId,
    undoReportDelete: undo,
  }
}

export function useDeleteTrip(projectId: number) {
  const [groupId, setGroupId] = useState<number | null>(null)

  const { handleDelete, pendingId, undo } = useOptimisticDelete<
    ProjectReportGroup[]
  >({
    projectId,
    listQueryKey: ['project-transports', projectId],
    co2Category: 'transport',
    prepare: (snapshot, tripId) => {
      const trip = snapshot
        ?.flatMap((g) => g.trips)
        .find((t) => t.id === tripId)
      setGroupId(
        snapshot?.find((g) => g.trips.some((t) => t.id === tripId))
          ?.report_id ?? null,
      )
      return {
        updatedList:
          snapshot?.map((g) => ({
            ...g,
            trips: g.trips.filter((t) => t.id !== tripId),
          })) ?? [],
        co2Delta: trip?.total_co2_kg ?? 0,
        entryCountDelta: 1,
      }
    },
    deleteFn: deleteTrip,
    errorMessage: 'Kunne ikke slette tur',
  })

  return {
    deleteTrip: handleDelete,
    pendingTripId: pendingId,
    pendingTripGroupId: pendingId != null ? groupId : null,
    undoTripDelete: undo,
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
