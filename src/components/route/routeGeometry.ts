import type { Place, TransitMode, Waypoint } from '@/types';

export type RoutePoint = [number, number];

export const routeOrigin: RoutePoint = [-26.2041, 28.0473];
export const routeVia: RoutePoint = [-26.1907, 28.0325];
export const routeDestination: RoutePoint = [-26.1854, 28.0242];

export const transitMetrics: Record<TransitMode, { minutes: number; speed: number }> = {
  walking: { minutes: 12, speed: 5 },
  driving: { minutes: 5, speed: 45 },
  transit: { minutes: 9, speed: 28 },
};

export function getRoutePoints(waypoints: Waypoint[], places: Place[]): RoutePoint[] {
  const stops = waypoints.length > 0
    ? waypoints.map(({ place }) => [place.coords.latitude, place.coords.longitude] as RoutePoint)
    : places.slice(0, 3).map((place) => [place.coords.latitude, place.coords.longitude] as RoutePoint);

  return [routeOrigin, routeVia, ...stops, routeDestination];
}

export function getRouteMetrics(mode: TransitMode, points: RoutePoint[]) {
  const distance = Number(Math.max(1.1, (points.length - 1) * 0.55).toFixed(1));
  const minutes = Math.max(1, Math.round(transitMetrics[mode].minutes * (distance / 1.1)));
  return { distance, minutes, speed: transitMetrics[mode].speed };
}
