import { useState } from 'react'

import { useAuthQuery } from '@/shared/hooks/useAuthQuery'
import { useAuthMutation } from '@/shared/hooks/useAuthMutation'
import { useOptimisticDelete } from '@/shared/hooks/useOptimisticDelete'

import {
  listProjectTransports,
  deleteTransportReport,
  deleteTrip,
  updateTrip,
  type ProjectReportGroup,
  type TripUpdateInput,
} from '../api/projectTransports'

export function useProjectTransports(projectId: number) {
  return useAuthQuery(['project-transports', projectId], (token) =>
    listProjectTransports(projectId, token),
  )
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
          snapshot
            ?.map((g) => ({
              ...g,
              trips: g.trips.filter((t) => t.id !== tripId),
            }))
            .filter((g) => g.trips.length > 0) ?? [],
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
  return useAuthMutation<{ tripId: number; data: TripUpdateInput }>({
    mutationFn: ({ tripId, data }, token) => updateTrip(tripId, data, token),
    invalidateKeys: [
      ['project-transports', projectId],
      ['co2-summary', projectId],
      ['detailed-report', projectId],
    ],
    successMessage: 'Tur oppdatert',
    errorMessage: 'Kunne ikke oppdatere tur',
  })
}
