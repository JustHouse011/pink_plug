import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer, GeoJSON, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet/dist/leaflet-src.js';
import 'leaflet/dist/leaflet.css';
import type { Place } from '@/types';
import './route-map.css';

type RouteMapProps = {
  places: Place[];
  selectedPlace: Place | null;
  dark: boolean;
  onDarkChange: (dark: boolean) => void;
  onSelectPlace: (place: Place) => void;
  onClosePlace: () => void;
  onOpenPlace: (place: Place) => void;
  onAddPlace: (place: Place) => void;
  onSharePlace: (place: Place) => void;
  onCheckIn: (place: Place) => void;
  routeProgress: number;
};

const center: [number, number] = [-26.1952, 28.0341];
const origin: [number, number] = [-26.2041, 28.0473];
const via: [number, number] = [-26.1907, 28.0325];
const destination: [number, number] = [-26.1854, 28.0242];

function MapFocus({ selectedPlace }: { selectedPlace: Place | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedPlace) map.flyTo([selectedPlace.coords.latitude, selectedPlace.coords.longitude], 14, { duration: 0.7 });
  }, [map, selectedPlace]);

  return null;
}

function MapControls() {
  const map = useMap();

  return (
    <div className="pink-route-map-controls">
      <button type="button" onClick={() => map.zoomIn()} aria-label="Zoom in">+</button>
      <button type="button" onClick={() => map.zoomOut()} aria-label="Zoom out">−</button>
    </div>
  );
}

function markerIcon(place: Place, index: number) {
  const kind = index === 0 ? 'from' : index === 1 ? 'via' : index === 2 ? 'to' : 'safe';
  const label = kind === 'from' ? 'FROM' : kind === 'via' ? 'VIA' : kind === 'to' ? 'TO' : '●';

  return L.divIcon({
    className: 'pink-route-marker-shell',
    html: `<span class="pink-route-marker pink-route-marker--${kind}">${label}</span>`,
    iconSize: [64, 30],
    iconAnchor: [32, 15],
    popupAnchor: [0, -18],
  });
}

export default function RouteMap({
  places,
  selectedPlace,
  dark,
  onDarkChange,
  onSelectPlace,
  onClosePlace,
  onOpenPlace,
  onAddPlace,
  onSharePlace,
  onCheckIn,
  routeProgress,
}: RouteMapProps) {
  const routeGeoJson = useMemo(() => ({
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: [origin, via, ...places.slice(0, 3).map((place) => [place.coords.longitude, place.coords.latitude]), destination],
    },
  }), [places]);
  const routeCoordinates: [number, number][] = [origin, via, ...places.slice(0, 3).map((place) => [place.coords.latitude, place.coords.longitude] as [number, number]), destination];
  const routePosition = useMemo(() => {
    const segment = Math.min(routeProgress, 1) * (routeCoordinates.length - 1);
    const index = Math.min(Math.floor(segment), routeCoordinates.length - 2);
    const fraction = segment - index;
    return [
      routeCoordinates[index][0] + (routeCoordinates[index + 1][0] - routeCoordinates[index][0]) * fraction,
      routeCoordinates[index][1] + (routeCoordinates[index + 1][1] - routeCoordinates[index][1]) * fraction,
    ] as [number, number];
  }, [routeCoordinates, routeProgress]);

  return (
    <section className={`pink-route-map-shell ${dark ? 'pink-route-map-shell--dark' : ''}`}>
      <div className="pink-route-map-heading">
        <h2>Johannesburg</h2>
        <button type="button" onClick={() => onDarkChange(!dark)}>{dark ? 'Light' : 'Dark'}</button>
      </div>
      <div className="pink-route-map">
        <MapContainer center={center} zoom={13} zoomControl={false} className="pink-route-map-canvas">
          <TileLayer
            key={dark ? 'dark' : 'light'}
            attribution='&copy; OpenStreetMap &copy; CARTO'
            url={dark
              ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
              : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'}
          />
          <GeoJSON
            data={routeGeoJson}
            pathOptions={{ color: '#7C3AED', weight: dark ? 15 : 11, opacity: dark ? 0.48 : 0.3, lineCap: 'round', lineJoin: 'round' }}
          />
          <Polyline positions={routeCoordinates.slice(0, Math.max(2, Math.floor(routeProgress * (routeCoordinates.length - 1)) + 1))} pathOptions={{ color: '#22C55E', weight: 6 }} />
          <Marker
            position={routePosition}
            icon={L.divIcon({ className: 'pink-route-current-marker', html: '<span>You</span>', iconSize: [44, 26], iconAnchor: [22, 13] })}
          />
          <GeoJSON
            data={routeGeoJson}
            pathOptions={{ color: dark ? '#F43F5E' : '#EC4899', weight: dark ? 6 : 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }}
          />
          <MapFocus selectedPlace={selectedPlace} />
          {places.map((place, index) => (
            <Marker
              key={place.id}
              position={[place.coords.latitude, place.coords.longitude]}
              icon={markerIcon(place, index)}
              eventHandlers={{ click: () => onSelectPlace(place) }}
            >
              <Popup className="pink-route-popup" closeButton={false} eventHandlers={{ remove: onClosePlace }}>
                <div className="pink-route-popup-card">
                  <div className="pink-route-popup-topline">
                    <div>
                      <strong>{place.name}</strong>
                      <span>{place.category} • {place.distance} • {place.safetyScore}% safe</span>
                    </div>
                    <button type="button" onClick={onClosePlace} aria-label="Close place popup">×</button>
                  </div>
                  <div className="pink-route-popup-pills">
                    {place.verifications.map((verification) => (
                      <span key={verification}>{verification === 'queer_owned' ? 'Queer owned' : verification === 'community_verified' ? 'Community verified' : 'Queer friendly'}</span>
                    ))}
                    <span>★ {place.rating}</span>
                  </div>
                  <div className="pink-route-popup-actions">
                    <button type="button" onClick={() => onAddPlace(place)}>Add to Route</button>
                    <button type="button" onClick={() => onOpenPlace(place)}>Open</button>
                    <button type="button" onClick={() => onSharePlace(place)}>Share</button>
                  </div>
                  <div className="pink-route-popup-actions pink-route-popup-actions--secondary">
                    <button type="button" onClick={() => onCheckIn(place)}>Check in</button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
          <MapControls />
          <div className="pink-route-sheet-bar">
            <strong>Maboneng → Braamfontein</strong>
            <span>12 min • 1.1 km • Safe route</span>
          </div>
        </MapContainer>
      </div>
    </section>
  );
}
