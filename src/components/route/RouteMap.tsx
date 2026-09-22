import { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import WebView from 'react-native-webview';

import { colors } from '@/constants/colors';
import type { Place } from '@/types';

type RouteMapProps = {
  places: Place[];
  routePlaces?: Place[];
  selectedPlace: Place | null;
  dark: boolean;
  onSelectPlace: (place: Place) => void;
  onClosePlace: () => void;
  onOpenPlace: (place: Place) => void;
  onAddPlace: (place: Place) => void;
  onSharePlace: (place: Place) => void;
  onCheckIn: (place: Place) => void;
  routeProgress: number;
  showRouteHud?: boolean;
};

const navBlue = '#0A1A2E';
const routePink = '#E63CD8';
const routeGreen = '#22C55E';
const routeOrange = '#F29C4A';
const routeDanger = '#F43F5E';
const userLocationGreen = '#2ED573';
const mockUserLocation = { latitude: -26.1952, longitude: 28.0341 };

export default function RouteMap({
  places,
  routePlaces = places,
  selectedPlace,
  dark,
  onSelectPlace,
  onClosePlace,
  onOpenPlace,
  onAddPlace,
  onSharePlace,
  onCheckIn,
  routeProgress,
  showRouteHud = false,
}: RouteMapProps) {
  const webViewRef = useRef<WebView>(null);

  const mapHtml = useMemo(() => {
    const allCoords = places.length > 0 ? places.map((place) => [place.coords.latitude, place.coords.longitude]) : [[mockUserLocation.latitude, mockUserLocation.longitude]];

    const userMarker = `
      const userLayer = L.circleMarker([${mockUserLocation.latitude}, ${mockUserLocation.longitude}], {
        radius: 11,
        color: '#eafff2',
        weight: 3,
        fillColor: '${userLocationGreen}',
        fillOpacity: 1,
      }).addTo(map);
      const userHalo = L.circle([${mockUserLocation.latitude}, ${mockUserLocation.longitude}], {
        radius: 36,
        color: 'rgba(46, 213, 115, 0.9)',
        weight: 4,
        fillColor: 'rgba(46, 213, 115, 0.28)',
        fillOpacity: 0.95,
      }).addTo(map);
      const userFlow = L.circle([${mockUserLocation.latitude}, ${mockUserLocation.longitude}], {
        radius: 72,
        color: 'rgba(46, 213, 115, 0.38)',
        weight: 3,
        fillColor: 'rgba(46, 213, 115, 0.18)',
        fillOpacity: 0.95,
      }).addTo(map);

      const moveUserTo = (point) => {
        userLayer.setLatLng(point);
        userHalo.setLatLng(point);
        userFlow.setLatLng(point);
      };

      const pulse = () => {
        userHalo.setRadius(36);
        userFlow.setRadius(72);
        userHalo.setStyle({ opacity: 1, fillOpacity: 0.32 });
        userFlow.setStyle({ opacity: 0.95, fillOpacity: 0.18 });
        setTimeout(() => {
          userHalo.setRadius(48);
          userFlow.setRadius(94);
          userHalo.setStyle({ opacity: 0.7, fillOpacity: 0.18 });
          userFlow.setStyle({ opacity: 0.55, fillOpacity: 0.08 });
        }, 650);
      };
      pulse();
      setInterval(pulse, 1500);
    `;

    const markers = places
      .map((place) => {
        const isSelected = selectedPlace && selectedPlace.id === place.id;
        const categoryLabel = place.category === 'drink' ? 'DRINK' : place.category === 'eat' ? 'EAT' : place.category === 'party' ? 'PARTY' : place.category === 'shop' ? 'SHOP' : place.category === 'wellness' ? 'WELL' : place.category === 'stay' ? 'STAY' : 'SAFE';
        const label = isSelected ? 'YOU' : categoryLabel;
        const pinColor = isSelected ? routeOrange : routePink;
        const pinHtml = `
          <div class="pink-route-pin" style="background:${pinColor};">
            <div class="pink-route-pin-circle" style="background:${colors.secondary};">${label}</div>
          </div>
        `;

        return `const marker${place.id}=L.marker([${place.coords.latitude},${place.coords.longitude}],{icon:L.divIcon({className:'pink-route-marker-shell',html:${JSON.stringify(pinHtml)},iconSize:[54,70],iconAnchor:[27,62]})}).addTo(map);marker${place.id}.on('click',()=>window.ReactNativeWebView.postMessage(JSON.stringify({action:'select',placeId:'${place.id}'})));`;
      })
      .join('');

    const mapColor = dark ? '#101B2A' : '#edf2f7';
    const tileUrl = dark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    const routeCoords = routePlaces.length > 0
      ? routePlaces.map((place) => `[${place.coords.latitude}, ${place.coords.longitude}]`).join(', ')
      : `[${mockUserLocation.latitude}, ${mockUserLocation.longitude}]`;

    const visiblePoints = `map.setView([${mockUserLocation.latitude}, ${mockUserLocation.longitude}], 13.9);`;

    const startingView = `map.setView([${mockUserLocation.latitude}, ${mockUserLocation.longitude}], 13.9);`;

    const routeSetup = showRouteHud && routePlaces.length > 0
      ? `const route = [${routeCoords}]; const bounds = L.latLngBounds(route); map.fitBounds(bounds.pad(0.32));`
      : `const route = []; ${visiblePoints || startingView}`;

    const routeLogic = showRouteHud && routePlaces.length > 1
      ? `L.polyline(route, { color: '${routeOrange}', weight: 11, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }).addTo(map);
            let passed, remaining;
            if (route.length > 1) {
              const progressPoint = route[0];
              const midPoint = route[Math.min(route.length - 1, 1)];
              const pos = [progressPoint[0], progressPoint[1]];
              passed = L.polyline([pos, midPoint], { color: '${routeGreen}', weight: 7, lineCap: 'round' }).addTo(map);
              remaining = L.polyline([midPoint].concat(route.slice(1)), { color: '${dark ? routeDanger : routePink}', weight: 6, dashArray: '8 8' }).addTo(map);
            }
            window.updateMockPosition = (p) => {
              const s = Math.min(Math.max(p, 0), 1) * (route.length - 1);
              const i = Math.min(Math.floor(s), route.length - 2);
              const f = s - i;
              const point = [
                route[i][0] + (route[i + 1][0] - route[i][0]) * f,
                route[i][1] + (route[i + 1][1] - route[i][1]) * f,
              ];
              passed?.remove();
              remaining?.remove();
              passed = L.polyline(route.slice(0, i + 1).concat([point]), { color: '${routeGreen}', weight: 7, lineCap: 'round' }).addTo(map);
              remaining = L.polyline([point].concat(route.slice(i + 1)), { color: '${dark ? routeDanger : routePink}', weight: 6, dashArray: '8 8' }).addTo(map);
              moveUserTo(point);
            };
            window.updateMockPosition(0);`
      : `window.updateMockPosition = () => {};`;

    return `<!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width,initial-scale=1"/>
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
          <style>
            html,body,#map{margin:0;height:100%;width:100%;background:${mapColor};}
            body{overflow:hidden;}
            #map{border-radius:26px;background:${mapColor};}
            .leaflet-container{background:${mapColor};}
            .leaflet-control-zoom{display:none;}
            .leaflet-tile{filter:saturate(.75) brightness(1.02);}
            .pink-route-marker-shell{background:transparent;border:0;}
            .pink-route-pin{
              position:relative;
              width:54px;
              height:54px;
              border-radius:50%;
              box-shadow:0 10px 18px rgba(0,0,0,0.14);
              background:linear-gradient(135deg, ${routePink}, #D81FAF);
              overflow:visible;
            }
            .pink-route-pin::after{
              content:'';
              position:absolute;
              left:50%;
              bottom:-14px;
              transform:translateX(-50%);
              width:22px;
              height:22px;
              background:inherit;
              clip-path:polygon(50% 100%, 0 0, 100% 0);
              border-radius:4px;
              z-index:-1;
            }
            .pink-route-pin-circle{
              position:absolute;
              inset:6px 6px 12px 6px;
              display:flex;
              align-items:center;
              justify-content:center;
              border-radius:50%;
              color:#fff;
              font-size:8px;
              font-weight:800;
              letter-spacing:-0.2px;
              line-height:1;
              text-transform:uppercase;
              text-align:center;
              padding:0 4px;
              box-sizing:border-box;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <script>
            const map = L.map('map', { zoomControl: false, attributionControl: false, zoomSnap: 0.25, zoomDelta: 0.5, minZoom: 12, maxZoom: 18 });
            window.routeMap = map;
            window.centerOnPlace = (latitude, longitude) => map.setView([latitude, longitude], 13.9, { animate: true });
            L.tileLayer(${JSON.stringify(tileUrl)}, { subdomains: 'abcd', maxZoom: 20 }).addTo(map);
            ${routeSetup}
            ${userMarker}
            ${routeLogic}
            ${markers}
          </script>
        </body>
      </html>`;
  }, [dark, places, routePlaces, selectedPlace, showRouteHud]);

  useEffect(() => {
    if (!selectedPlace) return;

    webViewRef.current?.injectJavaScript(
      `window.centerOnPlace?.(${selectedPlace.coords.latitude},${selectedPlace.coords.longitude});true;`,
    );
  }, [selectedPlace]);

  const recenterMap = () => {
    webViewRef.current?.injectJavaScript(
      `window.routeMap?.setView([${mockUserLocation.latitude}, ${mockUserLocation.longitude}], 15.5, { animate: true });true;`,
    );
  };

  useEffect(() => {
    webViewRef.current?.injectJavaScript(`window.updateMockPosition?.(${routeProgress});true;`);
  }, [routeProgress]);

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      const place = places.find((item) => item.id === payload.placeId);
      if (place && payload.action === 'select') {
        onSelectPlace(place);
      }
    } catch {
      // ignore invalid payloads
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapShell}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: mapHtml }}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          style={styles.mapView}
          onMessage={handleMessage}
        />

        {showRouteHud && (
          <>
            <View pointerEvents="none" style={styles.nextTurnCard}>
              <Text style={styles.nextTurnLabel}>Next turn</Text>
              <View style={styles.turnRow}>
                <Text style={styles.turnIcon}>↗</Text>
                <Text style={styles.turnDistance}>52m</Text>
              </View>
            </View>

            <Text style={styles.clock}>10:01 PM</Text>

            <View pointerEvents="none" style={styles.bottomStats}>
              <View style={styles.bottomMetric}>
                <Text style={styles.bottomMetricValue}>10:10 PM</Text>
                <Text style={styles.bottomMetricLabel}>Arrival</Text>
              </View>
              <View style={styles.bottomMetric}>
                <Text style={styles.bottomMetricValue}>3 min</Text>
                <Text style={styles.bottomMetricLabel}>ETA</Text>
              </View>
              <View style={styles.bottomMetric}>
                <Text style={styles.bottomMetricValue}>4.3km</Text>
                <Text style={styles.bottomMetricLabel}>Route</Text>
              </View>
            </View>
          </>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Recenter map on my location"
          onPress={recenterMap}
          style={styles.recenterButton}
        >
          <Text style={styles.recenterIcon}>◎</Text>
        </Pressable>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  mapShell: {
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: 420,
    overflow: 'hidden',
    borderRadius: 28,
    backgroundColor: navBlue,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  mapView: {
    width: '100%',
    height: '100%',
    backgroundColor: navBlue,
  },
  nextTurnCard: {
    position: 'absolute',
    top: 18,
    left: 16,
    minWidth: 190,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 115, 95, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  nextTurnLabel: {
    color: '#EAFDF7',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
  turnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  turnIcon: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 32,
  },
  turnDistance: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  clock: {
    position: 'absolute',
    top: 24,
    right: 22,
    color: '#F6F8FF',
    fontSize: 18,
    fontWeight: '700',
    opacity: 0.9,
  },
  recenterButton: {
    position: 'absolute',
    right: 16,
    bottom: 118,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 18,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  recenterIcon: {
    color: '#1D3A4A',
    fontSize: 18,
    fontWeight: '700',
  },
  routeSummaryCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 150,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(13,25,41,0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  routeSummaryTitle: {
    color: '#F3F7FF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  routeSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricBlock: {
    flex: 1,
    minWidth: 0,
    paddingTop: 6,
  },
  metricLabel: {
    color: 'rgba(235,241,255,0.76)',
    fontSize: 10,
    fontWeight: '600',
  },
  metricValue: {
    color: '#F8FAFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  bottomStats: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 72,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(18, 21, 31, 0.52)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    backdropFilter: 'blur(14px)',
  },
  bottomMetric: {
    flex: 1,
    alignItems: 'center',
  },
  bottomMetricValue: {
    color: '#F5F8FF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  bottomMetricLabel: {
    color: 'rgba(220,230,255,0.8)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  popup: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 90,
    zIndex: 20,
    backgroundColor: 'rgba(255,255,255,0.70)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  popupInfo: {
    flex: 1,
  },
  popupTitle: {
    color: '#1F2B3A',
    fontSize: 15,
    fontWeight: '700',
  },
  popupMeta: {
    color: '#536776',
    fontSize: 11,
    marginTop: 5,
  },
  close: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  actionsSecondary: {
    flexDirection: 'row',
    marginTop: 8,
  },
  action: {
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.secondary,
  },
  actionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  actionPrimary: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  actionPrimaryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
