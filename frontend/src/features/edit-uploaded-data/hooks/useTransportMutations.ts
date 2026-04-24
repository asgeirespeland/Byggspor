/**
 * Post-upload edit/delete mutations for transport.
 * useUpdateTrip, useDeleteTransportReport (whole report), useDeleteTrip (single trip —
 * also exposes pendingTripGroupId so the undo bar renders near the right card).
 */
import { useAuthMutation } from '@/shared/auth/useAuthMutation'
import { qk, projectReportKeys } from '@/shared/api/queryKeys'

import {
  deleteTransportReport,
  deleteTrip,
  updateTrip,
  type ProjectReportGroup,
  type ProjectTripItem,
  type TripUpdateInput,
} from '@/entities/transport'

import { useGroupDelete } from './useGroupDelete'
import { useItemDelete } from './useItemDelete'

export function useUpdateTrip(projectId: number) {
  return useAuthMutation<{ tripId: number; data: TripUpdateInput }>({
    mutationFn: ({ tripId, data }, token) => updateTrip(tripId, data, token),
    invalidateKeys: [qk.transports(projectId), ...projectReportKeys(projectId)],
    successMessage: 'Tur oppdatert',
    errorMessage: 'Kunne ikke oppdatere tur',
  })
}

export function useDeleteTransportReport(projectId: number) {
  const { handleDelete, pendingId, undo } = useGroupDelete<
    ProjectReportGroup,
    ProjectTripItem
  >({
    projectId,
    listQueryKey: qk.transports(projectId),
    co2Category: 'transport',
    matchBy: (g) => g.report_id,
    itemsOf: (g) => g.trips,
    co2Of: (trip) => trip.total_co2_kg ?? 0,
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
  const { handleDelete, pendingId, pendingGroupId, undo } = useItemDelete<
    ProjectReportGroup,
    ProjectTripItem
  >({
    projectId,
    listQueryKey: qk.transports(projectId),
    co2Category: 'transport',
    groupIdOf: (g) => g.report_id,
    itemsOf: (g) => g.trips,
    setItems: (g, trips) => ({ ...g, trips }),
    idOf: (trip) => trip.id,
    co2Of: (trip) => trip.total_co2_kg ?? 0,
    deleteFn: deleteTrip,
    errorMessage: 'Kunne ikke slette tur',
  })

  return {
    deleteTrip: handleDelete,
    pendingTripId: pendingId,
    pendingTripGroupId: pendingGroupId,
    undoTripDelete: undo,
  }
}
