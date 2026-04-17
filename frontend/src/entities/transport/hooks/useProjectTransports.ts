/**
 * React Query hooks for the transport tab: list, optimistic delete-report, optimistic delete-trip (tracks
 * originating report group for the undo bar), and update-trip. Invalidates the shared co2-summary +
 * detailed-report keys alongside project-transports.
 */
import { useState } from 'react'

import { useAuthQuery } from '@/shared/auth/useAuthQuery'
import { useAuthMutation } from '@/shared/auth/useAuthMutation'
import { useOptimisticDelete } from '@/widgets/data-table/useOptimisticDelete'
import { sumBy } from '@/shared/utils/collections'
import { qk, projectReportKeys } from '@/shared/api/queryKeys'

import {
  listProjectTransports,
  deleteTransportReport,
  deleteTrip,
  updateTrip,
  type ProjectReportGroup,
  type TripUpdateInput,
} from '../api/projectTransports'

export function useProjectTransports(projectId: number) {
  return useAuthQuery(qk.transports(projectId), (token) =>
    listProjectTransports(projectId, token),
  )
}

export function useDeleteTransportReport(projectId: number) {
  const { handleDelete, pendingId, undo } = useOptimisticDelete<
    ProjectReportGroup[]
  >({
    projectId,
    listQueryKey: qk.transports(projectId),
    co2Category: 'transport',
    prepare: (snapshot, id) => {
      const trips = snapshot?.find((g) => g.report_id === id)?.trips ?? []
      return {
        updatedList: snapshot?.filter((g) => g.report_id !== id) ?? [],
        co2Delta: sumBy(trips, (t) => t.total_co2_kg),
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
    listQueryKey: qk.transports(projectId),
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
    invalidateKeys: [qk.transports(projectId), ...projectReportKeys(projectId)],
    successMessage: 'Tur oppdatert',
    errorMessage: 'Kunne ikke oppdatere tur',
  })
}
