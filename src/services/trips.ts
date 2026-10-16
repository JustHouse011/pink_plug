import { apiCall } from './api';
import type { CheckIn, PlannedRoute, TransitMode } from '@/types';

/** Routes (E62-E65) and manual check-ins (E66). */

export interface RouteInput {
  mode: TransitMode;
  placeIds: string[];
  selectedPlaceId?: string | null;
  departureAt?: string | null;
  status?: 'draft' | 'active';
}

/** E62 */
export function createRoute(input: RouteInput): Promise<PlannedRoute> {
  return apiCall<PlannedRoute>('/routes', { method: 'POST', body: input, idempotent: true });
}

/** E65 — status moves draft → active → ended only. */
export function updateRoute(id: string, patch: Partial<Omit<RouteInput, 'status'>> & { status?: PlannedRoute['status'] }): Promise<PlannedRoute> {
  return apiCall<PlannedRoute>(`/routes/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch });
}

/** E66 — a manual, user-selected check-in; it notifies no one. */
export function createCheckIn(input: { placeId: string; routeId?: string; observedAt?: string }): Promise<CheckIn> {
  return apiCall<CheckIn>('/check-ins', {
    method: 'POST',
    body: { ...input, observedAt: input.observedAt ?? new Date().toISOString() },
    idempotent: true,
  });
}
