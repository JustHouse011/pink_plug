import { apiCall, apiList, apiListAll } from './api';
import type { Coords, DirectoryResource, Event, Option, Paged, Place, Review, SafetyResource } from '@/types';

/**
 * Read-only catalogue endpoints: places (E26-E33), events (E34-E38),
 * directory (E39-E40) and safety resources (E56).
 */

export interface PlaceQuery {
  search?: string;
  category?: Place['category'];
  city?: string;
  origin?: Coords;
  radiusKm?: number;
}

export interface ReviewInput {
  rating: number;
  comment: string;
  headline?: string;
}

const originQuery = (origin?: Coords) => (origin ? { latitude: origin.latitude, longitude: origin.longitude } : {});

/** E26 — every matching place (the catalogue is small and screens filter it locally). */
export function listPlaces({ origin, ...filters }: PlaceQuery = {}): Promise<Place[]> {
  return apiListAll<Place>('/places', { query: { ...filters, ...originQuery(origin) } });
}

/** E27 — one place with all of its reviews. */
export function getPlace(id: string, origin?: Coords): Promise<Place> {
  return apiCall<Place>(`/places/${encodeURIComponent(id)}`, { query: originQuery(origin) });
}

/** E28 */
export function listPlaceCategories(): Promise<Option[]> {
  return apiListAll<Option>('/places/categories');
}

/** E33 — one review per member per place (409 CONFLICT on repeat). */
export function createPlaceReview(placeId: string, input: ReviewInput): Promise<Review> {
  return apiCall<Review>(`/places/${encodeURIComponent(placeId)}/reviews`, { method: 'POST', body: input, idempotent: true });
}

/** E34 */
export function listEvents(filters: { search?: string; type?: Event['type']; featured?: boolean } = {}): Promise<Event[]> {
  return apiListAll<Event>('/events', { query: filters });
}

/** E35 */
export function getEvent(id: string): Promise<Event> {
  return apiCall<Event>(`/events/${encodeURIComponent(id)}`);
}

/** E36 — one registration per member per event. */
export function registerForEvent(eventId: string, input: { name: string; email: string; phone: string }) {
  return apiCall<{ id: string; eventId: string; createdAt: string }>(`/events/${encodeURIComponent(eventId)}/register`, {
    method: 'POST',
    body: input,
    idempotent: true,
  });
}

/** E38 */
export function createEventReview(eventId: string, input: ReviewInput): Promise<Review> {
  return apiCall<Review>(`/events/${encodeURIComponent(eventId)}/reviews`, { method: 'POST', body: input, idempotent: true });
}

/** E39 — paginated, searched and filtered server-side. */
export function listDirectoryResources(filters: { search?: string; category?: string; city?: string; page?: number; limit?: number } = {}): Promise<Paged<DirectoryResource>> {
  return apiList<DirectoryResource>('/directory/resources', { query: { limit: 100, ...filters } });
}

/** E40 */
export function listDirectoryCategories(): Promise<Option[]> {
  return apiListAll<Option>('/directory/categories');
}

/** E56 — public, so it works signed out too. */
export function listSafetyResources(): Promise<SafetyResource[]> {
  return apiListAll<SafetyResource>('/safety/resources', { auth: 'optional' });
}
