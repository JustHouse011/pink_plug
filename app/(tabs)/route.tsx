import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTabScreenLayout } from '@/layout/tabLayout';
import { useRouter } from 'expo-router';
import { colors, darkColors } from '@/constants/colors';
import { MOCK_PLACES } from '@/data/mockData';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import RouteMap from '@/components/route/RouteMap';
import MapControlButton from '@/components/route/MapControlButton';
import PlaceMapSheet from '@/components/route/PlaceMapSheet';
import { useTheme } from '@/context/ThemeProvider';
import { useAppStore } from '@/store/useAppStore';
import { useEmergencyContactsStore } from '@/store/useEmergencyContactsStore';
import type { Place } from '@/types';
import { placeRoute } from '@/navigation/routes';
import { getRouteMetrics, getRoutePoints } from '@/components/route/routeGeometry';
import { shareContent } from '@/services/sharing';

const categoryOptions = ['All', 'stay', 'eat', 'drink', 'party', 'shop', 'culture', 'wellness', 'services'] as const;
const categoryLabels: Record<string, string> = {
  All: 'All',
  stay: 'Stay',
  eat: 'Eat',
  drink: 'Drink',
  party: 'Party',
  shop: 'Shop',
  culture: 'Culture',
  wellness: 'Wellness',
  services: 'Services',
};

const verificationLabels: Record<string, string> = {
  queer_owned: 'Queer owned',
  queer_friendly: 'Queer friendly',
  community_verified: 'Community verified',
};

const routeCurrentLocation = { latitude: -26.1952, longitude: 28.0341 };

type SharePayload = {
  title: string;
  message: string;
  url?: string;
};

const getDistanceFromCurrentLocation = (place: Place) => {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(place.coords.latitude - routeCurrentLocation.latitude);
  const dLng = toRadians(place.coords.longitude - routeCurrentLocation.longitude);
  const lat1 = toRadians(routeCurrentLocation.latitude);
  const lat2 = toRadians(place.coords.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function Route() {
  const tabLayout = useTabScreenLayout();
  const router = useRouter();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const waypoints = useAppStore((state) => state.waypoints);
  const add = useAppStore((state) => state.addWaypoint);
  const remove = useAppStore((state) => state.removeWaypoint);
  const mode = useAppStore((state) => state.transitMode);
  const setMode = useAppStore((state) => state.setTransitMode);
  const contacts = useEmergencyContactsStore((state) => state.contacts);
  const { isDark } = useTheme();
  const [checkedInPlace, setCheckedInPlace] = useState<Place | null>(null);
  const [checkedInAt, setCheckedInAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [routeStartedAt, setRouteStartedAt] = useState<number | null>(null);
  const [routeElapsedSeconds, setRouteElapsedSeconds] = useState(0);
  const [showDeparturePrompt, setShowDeparturePrompt] = useState(false);
  const [addRouteModalVisible, setAddRouteModalVisible] = useState(false);
  const [addRouteQuery, setAddRouteQuery] = useState('');
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const initialWaypointIds = useRef<Set<string> | null>(null);
  const [waypointBaselineReady, setWaypointBaselineReady] = useState(false);

  useEffect(() => {
    if (!hasHydrated || waypointBaselineReady) return;

    initialWaypointIds.current = new Set(waypoints.map((waypoint) => waypoint.id));
    setWaypointBaselineReady(true);
  }, [hasHydrated, waypointBaselineReady, waypoints]);
  const routeDurationMinutes = 12;

  const getLocationShareMessage = (place: Place) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.coords.latitude},${place.coords.longitude}`;

    return `I’m sharing a safe Pink Route stop: ${place.name} at ${place.address}.\nLocation: ${mapsUrl}`;
  };

  const handleSharePlace = async (place: Place) => {
    const message = getLocationShareMessage(place);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.coords.latitude},${place.coords.longitude}`;
    openShareModal({ title: place.name, message, url: mapsUrl });
  };

  const handleCheckIn = (place: Place) => {
    setCheckedInPlace(place);
    setCheckedInAt(Date.now());
    setElapsedSeconds(0);
    setSelectedPlaceId(place.id);
    Alert.alert('Checked in', `Your mock location pin is set to ${place.name}.`);
  };

  const openShareModal = (payload: SharePayload) => {
    const smsContacts = contacts.filter((contact) => contact.canReceiveSms);

    if (smsContacts.length === 0) {
      Alert.alert('No SMS contacts', 'Add a trusted contact who can receive SMS before sharing your trip.');
      return;
    }

    setSharePayload(payload);
    setSelectedContactIds(smsContacts.map((contact) => contact.id));
    setShareModalVisible(true);
  };

  const sendToSelectedContacts = async () => {
    if (!sharePayload) return;

    const recipients = contacts.filter(
      (contact) => selectedContactIds.includes(contact.id) && contact.canReceiveSms,
    );

    if (recipients.length === 0) {
      Alert.alert('Choose a contact', 'Select at least one trusted contact to continue.');
      return;
    }

    const message = sharePayload.url
      ? `${sharePayload.message}\n${sharePayload.url}`
      : sharePayload.message;
    const separator = Platform.OS === 'ios' ? ',' : ';';
    const smsUrl = `sms:${recipients.map((contact) => contact.phone).join(separator)}?body=${encodeURIComponent(message)}`;

    try {
      if (Platform.OS !== 'web' && await Linking.canOpenURL(smsUrl)) {
        await Linking.openURL(smsUrl);
      } else {
        await shareContent(sharePayload);
      }
    } catch {
      await shareContent(sharePayload);
    }

    setShareModalVisible(false);
    setSharePayload(null);
  };

  const getRouteSummaryMessage = () => {
    const startLabel = waypoints[0]?.place?.name ?? 'My current location';
    const destinationLabel = selectedPlace?.name ?? waypoints[waypoints.length - 1]?.place?.name ?? 'my destination';
    const stopList = waypoints.length > 0
      ? waypoints.map((item) => item.place.name).join(', ')
      : 'No saved stops yet';

    return `I’m sharing my Pink Route. Start: ${startLabel}. Destination: ${destinationLabel}. Stops: ${stopList}.`;
  };

  const handleSaveLocation = () => {
    const target = selectedPlace ?? waypoints[waypoints.length - 1]?.place ?? null;

    if (!target) {
      Alert.alert('No destination selected', 'Choose a place from the map or search results first.');
      return;
    }

    if (waypoints.some((item) => item.place.id === target.id)) {
      Alert.alert('Already saved', `${target.name} is already in your route.`);
      return;
    }

    add(target);
    setSaved((current) => (current.includes(target.id) ? current : [...current, target.id]));
    Alert.alert('Location saved', `${target.name} was added to your Pink Route.`);
  };

  const handleAddDestination = () => {
    setAddRouteQuery('');
    setAddRouteModalVisible(true);
  };

  const openAddRouteModal = (place?: Place) => {
    setAddRouteQuery(place?.name ?? '');
    setAddRouteModalVisible(true);
  };

  const addPlaceToRoute = (place: Place) => {
    if (waypoints.some((item) => item.place.id === place.id)) {
      Alert.alert('Already on route', `${place.name} is already in your saved route.`);
      return;
    }

    add(place);
    setSelectedPlaceId(place.id);
    setAddRouteModalVisible(false);
    setAddRouteQuery('');
    Alert.alert('Destination added', `${place.name} was added to your route.`);
  };

  const handleShareRoute = async () => {
    if (!selectedPlace && waypoints.length === 0) {
      Alert.alert('No route selected', 'Choose a destination or add a place to your route before sharing.');
      return;
    }

    const message = getRouteSummaryMessage();
    openShareModal({ title: 'Pink Route', message });
  };

  useEffect(() => {
    if (!checkedInAt) return;

    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - checkedInAt) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [checkedInAt]);

  useEffect(() => {
    if (!routeStartedAt) return;

    const timer = setInterval(() => {
      setRouteElapsedSeconds(Math.floor((Date.now() - routeStartedAt) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [routeStartedAt]);

  const formatElapsed = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const routeMinutesRemaining = Math.max(
    0,
    routeDurationMinutes - Math.floor(routeElapsedSeconds / 60),
  );
  const routeProgress = routeStartedAt
    ? Math.min(1, routeElapsedSeconds / (routeDurationMinutes * 60))
    : 0;

  const startRoute = () => {
    const destination = selectedPlace ?? waypoints[waypoints.length - 1]?.place;
    if (!destination) return;
    setQuery('');
    setCategory('All');
    setNearMe(true);
    setRouteStartedAt(Date.now());
    setRouteElapsedSeconds(1);
    setLeavingNow(true);
    setDepartureTime(null);
    setShowDeparturePrompt(false);
    Alert.alert('Route started', `You are now in transit to ${destination.name}.`);
  };

  const endTrip = () => {
    setRouteStartedAt(null);
    setRouteElapsedSeconds(0);
    setLeavingNow(false);
    setDepartureTime(null);
    setShowDeparturePrompt(false);
    setSelectedPlaceId(null);
    setSheetState('partial');
    Alert.alert('Trip ended', 'Your live Pink Route has been ended.');
  };

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof categoryOptions)[number]>('All');
  const [nearMe, setNearMe] = useState(true);
  const [saved, setSaved] = useState<string[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [leavingNow, setLeavingNow] = useState(false);
  const [departureTime, setDepartureTime] = useState<string | null>(null);
  const [sheetState, setSheetState] = useState<'collapsed' | 'partial' | 'expanded'>('partial');

  const handleSelectPlace = (place: Place) => {
    setSelectedPlaceId(place.id);
    setLeavingNow(false);
    setDepartureTime(null);
  };

  const dataPlaces = useMemo(() =>
    MOCK_PLACES.filter((place) => Number.isFinite(place.coords?.latitude) && Number.isFinite(place.coords?.longitude)),
    [],
  );

  const handleScheduleDeparture = () => {
    Alert.alert('Set departure time', `When would you like to leave for ${selectedPlace?.name ?? 'your destination'}?`, [
      { text: 'In 15 minutes', onPress: () => setDepartureTime('In 15 minutes') },
      { text: 'In 30 minutes', onPress: () => setDepartureTime('In 30 minutes') },
      { text: 'In 1 hour', onPress: () => setDepartureTime('In 1 hour') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const filteredPlaces = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...dataPlaces]
      .filter((place) => {
        const matchesCategory = category === 'All' || place.category === category;
        const matchesQuery =
          normalizedQuery.length === 0 ||
          place.name.toLowerCase().includes(normalizedQuery) ||
          place.address.toLowerCase().includes(normalizedQuery) ||
          place.description.toLowerCase().includes(normalizedQuery) ||
          place.city.toLowerCase().includes(normalizedQuery) ||
          place.category.toLowerCase().includes(normalizedQuery);

        const matchesNearby = !nearMe || getDistanceFromCurrentLocation(place) <= 3.5;

        return matchesCategory && matchesQuery && matchesNearby;
      })
      .sort((a, b) => getDistanceFromCurrentLocation(a) - getDistanceFromCurrentLocation(b));
  }, [category, dataPlaces, nearMe, query]);

  const toggleSaved = (id: string) => {
    setSaved((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const visibleMarkers = filteredPlaces;
  const selectedPlace = dataPlaces.find((place) => place.id === selectedPlaceId) ?? null;
  const hasRouteDestination = waypointBaselineReady
    && waypoints.some((waypoint) => !initialWaypointIds.current?.has(waypoint.id));

  const destinationCandidates = query.trim().length > 0 ? filteredPlaces.slice(0, 5) : [];
  const addRouteCandidates = useMemo(() => {
    const normalizedQuery = addRouteQuery.trim().toLowerCase();

    return MOCK_PLACES.filter((place) => {
      if (!normalizedQuery) return true;

      return [place.name, place.address, place.city, place.category]
        .some((value) => value.toLowerCase().includes(normalizedQuery));
    }).slice(0, 8);
  }, [addRouteQuery]);
  const routeMetrics = useMemo(
    () => getRouteMetrics(mode, getRoutePoints(waypoints, visibleMarkers)),
    [mode, visibleMarkers, waypoints],
  );

  return (
    <SafeAreaView edges={tabLayout.edges} style={[styles.safe, isDark && styles.safeDark]}>
      <View style={styles.screen}>
        <RouteMap
          places={visibleMarkers}
          routePlaces={waypoints.map((waypoint) => waypoint.place)}
          selectedPlace={selectedPlace}
          dark={isDark}
          onSelectPlace={handleSelectPlace}
          onClosePlace={() => setSelectedPlaceId(null)}
          onOpenPlace={(place) => router.push(placeRoute(place.id))}
          onAddPlace={addPlaceToRoute}
          onSharePlace={handleSharePlace}
          onCheckIn={handleCheckIn}
          routeProgress={routeProgress}
          showRouteHud={Boolean(routeStartedAt)}
        />

        <View style={styles.hudTop} pointerEvents="box-none">
          <GlassCard style={[styles.discoveryBar, isDark && styles.discoveryBarDark]}>
            <View style={[styles.discoverySearchRow, isDark && styles.discoverySearchRowDark]}>
              <Text style={styles.discoverySearchIcon}>⌕</Text>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Where do you want to go?"
                placeholderTextColor={isDark ? darkColors.muted : colors.muted}
                style={[styles.discoverySearch, isDark && styles.darkText]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Toggle nearby places"
                onPress={() => setNearMe((current) => !current)}
                style={[styles.nearbyButton, isDark && styles.nearbyButtonDark, nearMe && styles.nearbyButtonActive]}
              >
                <Text style={[styles.nearbyButtonText, isDark && styles.nearbyButtonTextDark]}>{nearMe ? 'Nearby' : 'All'}</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
              style={styles.filterScroll}
            >
              {categoryOptions.map((option) => (
                <View key={option} style={styles.filterChipWrap}>
                  <Chip label={categoryLabels[option]} active={category === option} onPress={() => setCategory(option)} />
                </View>
              ))}
            </ScrollView>

            {destinationCandidates.length > 0 && (
              <View style={styles.searchResults}>
                {destinationCandidates.map((place) => (
                  <Pressable
                    key={place.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Choose ${place.name} as destination`}
                    onPress={() => {
                      handleSelectPlace(place);
                      setQuery(place.name);
                    }}
                    style={styles.searchResult}
                  >
                    <View style={styles.searchResultIcon}><Text style={styles.searchResultIconText}>●</Text></View>
                    <View style={styles.searchResultInfo}>
                      <Text style={[styles.searchResultName, isDark && styles.darkText]}>{place.name}</Text>
                      <Text style={[styles.searchResultMeta, isDark && styles.darkSecondaryText]}>{place.category} • {place.distance} • {place.safetyScore}% safe</Text>
                    </View>
                    <Text style={styles.searchResultArrow}>›</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </GlassCard>

          <View style={styles.topControls}>
            <MapControlButton label="⌕" onPress={() => setQuery('')} isDark={isDark} />
            <MapControlButton label="＋" onPress={handleAddDestination} isDark={isDark} accent />
            <MapControlButton label="◎" onPress={handleShareRoute} isDark={isDark} />
          </View>

          {routeStartedAt && (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add another stop to the route"
                onPress={handleAddDestination}
                style={[
                  styles.addStopPill,
                  isDark && styles.addStopPillDark,
                  (query.trim().length > 0 || destinationCandidates.length > 0) && styles.addStopPillExpanded,
                ]}
              >
                <Text style={[styles.addStopText, isDark && styles.addStopTextDark]}>Add stop</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="End trip"
                onPress={endTrip}
                style={[styles.endTripPill, isDark && styles.endTripPillDark]}
              >
                <Text style={[styles.endTripText, isDark && styles.endTripTextDark]}>End trip</Text>
              </Pressable>
            </>
          )}

          {hasRouteDestination && !routeStartedAt && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start route"
              onPress={() => setShowDeparturePrompt(true)}
              style={[styles.startRoutePill, isDark && styles.startRoutePillDark]}
            >
              <Text style={[styles.startRouteText, isDark && styles.startRouteTextDark]}>Start route</Text>
            </Pressable>
          )}
        </View>

        {showDeparturePrompt && !routeStartedAt && (
          <GlassCard style={[styles.departurePrompt, isDark && styles.departurePromptDark]}>
            <View style={styles.departurePromptText}>
              <Text style={[styles.departureTitle, isDark && styles.darkText]}>Are you leaving now?</Text>
              <Text style={[styles.departureSubtitle, isDark && styles.darkSecondaryText]}>
                {departureTime ? `Departure scheduled ${departureTime.toLowerCase()}.` : 'Start a live mock trip to your route destination.'}
              </Text>
            </View>
            <View style={styles.departureActions}>
              <Button label={departureTime ? 'Change time' : 'Not yet'} onPress={handleScheduleDeparture} style={styles.departureButton} />
              <Button label="Yes, start" variant="success" onPress={startRoute} style={styles.departureButton} />
            </View>
          </GlassCard>
        )}

        {selectedPlace && (
          <PlaceMapSheet
            place={selectedPlace}
            isDark={isDark}
            sheetState={sheetState}
            onStateChange={setSheetState}
            onClose={() => setSelectedPlaceId(null)}
            onAddRoute={() => addPlaceToRoute(selectedPlace)}
            onOpenDetails={() => router.push(placeRoute(selectedPlace.id))}
            onShare={() => handleSharePlace(selectedPlace)}
            onCheckIn={() => handleCheckIn(selectedPlace)}
          />
        )}

        {checkedInPlace && (
          <View style={[styles.checkInCard, isDark && styles.checkInCardDark]}>
            <View style={styles.checkInDot} />
            <View style={styles.checkInInfo}>
              <Text style={[styles.checkInTitle, isDark && styles.darkText]}>Checked in at {checkedInPlace.name}</Text>
              <Text style={[styles.checkInSubtitle, isDark && styles.darkSecondaryText]}>Mock location pin active</Text>
            </View>
            <Text style={styles.checkInTimer}>{formatElapsed(elapsedSeconds)}</Text>
            <Pressable onPress={() => openShareModal({ title: 'Pink Route check-in', message: `I’m checked in at ${checkedInPlace.name}.\n${checkedInPlace.address}` })}>
              <Text style={styles.shareCheckIn}>Share</Text>
            </Pressable>
            <Pressable onPress={() => { setCheckedInPlace(null); setCheckedInAt(null); setElapsedSeconds(0); }}>
              <Text style={styles.endCheckIn}>End</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Modal
        visible={addRouteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddRouteModalVisible(false)}
      >
        <View style={styles.addRouteOverlay}>
          <View style={[styles.addRouteModal, isDark && styles.addRouteModalDark]}>
            <View style={styles.addRouteHeader}>
              <View>
                <Text style={[styles.addRouteTitle, isDark && styles.darkText]}>Add to route</Text>
                <Text style={[styles.addRouteSubtitle, isDark && styles.darkSecondaryText]}>Search for a safe place or town.</Text>
              </View>
              <Pressable onPress={() => setAddRouteModalVisible(false)} accessibilityLabel="Close add to route">
                <Text style={styles.addRouteClose}>Close</Text>
              </Pressable>
            </View>

            <TextInput
              autoFocus
              value={addRouteQuery}
              onChangeText={setAddRouteQuery}
              placeholder="Enter a location or town"
              placeholderTextColor={colors.muted}
              style={[styles.addRouteInput, isDark && styles.addRouteInputDark]}
            />

            <ScrollView style={styles.addRouteResults} keyboardShouldPersistTaps="handled">
              {addRouteCandidates.map((place) => (
                <Pressable
                  key={place.id}
                  style={[styles.addRouteResult, isDark && styles.addRouteResultDark]}
                  onPress={() => addPlaceToRoute(place)}
                >
                  <View style={styles.addRouteResultIcon}><Text style={styles.addRouteResultIconText}>+</Text></View>
                  <View style={styles.addRouteResultInfo}>
                    <Text style={[styles.addRouteResultName, isDark && styles.darkText]}>{place.name}</Text>
                    <Text style={[styles.addRouteResultMeta, isDark && styles.darkSecondaryText]}>{place.city} · {place.category} · {place.distance}</Text>
                  </View>
                  <Text style={styles.addRouteResultArrow}>›</Text>
                </Pressable>
              ))}
              {addRouteCandidates.length === 0 && (
                <Text style={[styles.addRouteEmpty, isDark && styles.darkSecondaryText]}>No places found. Try another location or town.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={shareModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.shareOverlay}>
          <View style={[styles.shareModal, isDark && styles.shareModalDark]}>
            <View style={styles.addRouteHeader}>
              <View>
                <Text style={[styles.addRouteTitle, isDark && styles.darkText]}>Share with contacts</Text>
                <Text style={[styles.addRouteSubtitle, isDark && styles.darkSecondaryText]}>Choose who should receive this update.</Text>
              </View>
              <Pressable onPress={() => setShareModalVisible(false)} accessibilityLabel="Close share contacts">
                <Text style={styles.addRouteClose}>Close</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.shareContactList}>
              {contacts.filter((contact) => contact.canReceiveSms).map((contact) => {
                const selected = selectedContactIds.includes(contact.id);

                return (
                  <Pressable
                    key={contact.id}
                    onPress={() => setSelectedContactIds((current) => selected
                      ? current.filter((id) => id !== contact.id)
                      : [...current, contact.id])}
                    style={[styles.shareContactRow, isDark && styles.shareContactRowDark, selected && styles.shareContactRowSelected]}
                  >
                    <View style={[styles.shareContactCheck, selected && styles.shareContactCheckSelected]}>
                      <Text style={styles.shareContactCheckText}>{selected ? '✓' : ''}</Text>
                    </View>
                    <View style={styles.shareContactInfo}>
                      <Text style={[styles.shareContactName, isDark && styles.darkText]}>{contact.name}</Text>
                      <Text style={[styles.shareContactMeta, isDark && styles.darkSecondaryText]}>{contact.relationship}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Button label="Open message" variant="success" onPress={sendToSelectedContacts} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  safeDark: { backgroundColor: 'transparent' },
  screen: { flex: 1, position: 'relative', overflow: 'hidden', paddingTop: 0, paddingBottom: 0 },
  hudTop: { position: 'absolute', top: 8, left: 12, right: 12, zIndex: 20 },
  topControls: { position: 'absolute', top: 8, right: 12, gap: 10, zIndex: 22 },
  addStopPill: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 146,
    zIndex: 21,
    alignSelf: 'center',
    backgroundColor: '#FFF5FB',
    borderWidth: 1,
    borderColor: 'rgba(194, 46, 145, 0.45)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: '#7A4D7C',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  addStopPillExpanded: {
    top: 182,
  },
  addStopPillDark: { backgroundColor: 'rgba(230, 60, 216, 0.2)', borderColor: 'rgba(230, 60, 216, 0.45)' },
  addStopText: { color: '#5C1B4B', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  addStopTextDark: { color: '#FCE7FF' },
  endTripPill: {
    position: 'absolute',
    right: 12,
    top: 146,
    zIndex: 21,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(208, 27, 73, 0.38)',
    shadowColor: '#7A4D7C',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  endTripPillDark: { backgroundColor: 'rgba(58, 18, 36, 0.82)', borderColor: 'rgba(255, 120, 160, 0.38)' },
  endTripText: { color: '#A11B3D', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  endTripTextDark: { color: '#FFD7E3' },
  startRoutePill: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 146,
    zIndex: 21,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#E63CD8',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#7A4D7C',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  startRoutePillDark: { backgroundColor: '#A92BA0' },
  startRouteText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  startRouteTextDark: { color: '#FFFFFF' },
  filterScroll: { marginTop: 10 },
  filterRow: { paddingRight: 12, gap: 8, alignItems: 'center' },
  filterChipWrap: { marginRight: 0 },
  routeMetricsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 8 },
  metricTitle: { fontSize: 14, fontWeight: '700' },
  metricDivider: { fontSize: 14, fontWeight: '700' },
  metricValue: { fontSize: 12, fontWeight: '600' },
  checkInCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18, padding: 14, borderRadius: 16, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' },
  checkInCardDark: { backgroundColor: '#132A24', borderColor: '#176B50' },
  checkInDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E' },
  checkInInfo: { flex: 1 },
  checkInTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '500' },
  checkInSubtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
  checkInTimer: { color: '#16A34A', fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'] },
  endCheckIn: { color: colors.danger, fontSize: 12, fontWeight: '500' },
  shareCheckIn: { color: '#0A8A4F', fontSize: 12, fontWeight: '600' },
  transitBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, padding: 12, borderRadius: 14, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' },
  transitBannerDark: { backgroundColor: '#132A24', borderColor: '#176B50' },
  transitDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E' },
  transitInfo: { flex: 1 },
  transitTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '500' },
  transitSubtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
  transitTime: { color: '#16A34A', fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
  endTransit: { color: colors.danger, fontSize: 12, fontWeight: '500' },
  darkText: { color: darkColors.textPrimary },
  darkSecondaryText: { color: darkColors.textSecondary },
  content: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: 20, paddingBottom: 120 },
  title: { color: colors.textPrimary, fontSize: 29, fontWeight: '500' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 4, marginBottom: 18 },
  discoveryBar: { marginBottom: 14, padding: 12, borderRadius: 22 },
  discoveryBarDark: { borderColor: darkColors.border },
  discoverySearchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingHorizontal: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.58)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)' },
  discoverySearchRowDark: { minHeight: 50, backgroundColor: darkColors.surface, borderColor: darkColors.border },
  discoverySearchIcon: { color: colors.primary, fontSize: 24, lineHeight: 24 },
  discoverySearch: { flex: 1, minWidth: 0, paddingVertical: 8, color: colors.textPrimary, fontSize: 13 },
  nearbyButton: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.72)' },
  nearbyButtonDark: { backgroundColor: darkColors.softSurface, borderWidth: 1, borderColor: darkColors.border },
  nearbyButtonActive: { backgroundColor: 'rgba(0,200,83,0.14)' },
  nearbyButtonText: { color: '#168A4A', fontSize: 10, fontWeight: '600' },
  nearbyButtonTextDark: { color: darkColors.textSecondary },
  searchResults: { marginTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(122,92,244,0.12)' },
  searchResult: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  searchResultIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,200,83,0.14)' },
  searchResultIconText: { color: '#00C853', fontSize: 12 },
  searchResultInfo: { flex: 1 },
  searchResultName: { color: colors.textPrimary, fontSize: 12, fontWeight: '600' },
  searchResultMeta: { color: colors.textSecondary, fontSize: 10, marginTop: 3, textTransform: 'capitalize' },
  searchResultArrow: { color: colors.primary, fontSize: 22 },
  routePlanner: { marginBottom: 14, padding: 14, borderRadius: 22 },
  routePlannerDark: { borderColor: darkColors.border },
  routePlannerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routePlannerText: { flex: 1 },
  routePlannerLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '400' },
  routePlannerValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '400', marginTop: 2 },
  routePlannerConnector: { width: 1, height: 12, marginLeft: 5, marginVertical: 2, backgroundColor: colors.border },
  originDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#00C853', borderWidth: 3, borderColor: '#DDF8E9' },
  destinationDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.primary, borderWidth: 3, borderColor: '#F7D8F4' },
  transportPills: { flexDirection: 'row', gap: 8, marginTop: 12 },
  departurePrompt: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, padding: 14, borderRadius: 20 },
  departurePromptDark: { borderColor: darkColors.border },
  departurePromptText: { flex: 1 },
  departureTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  departureSubtitle: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 3 },
  departureActions: { flexDirection: 'row', gap: 7 },
  departureButton: { minHeight: 38, paddingHorizontal: 10 },
  trackingHeader: { marginBottom: 14, padding: 16, borderRadius: 22 },
  trackingHeaderDark: { borderColor: darkColors.border },
  trackingHeaderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trackingEyebrow: { color: colors.primary, fontSize: 10, fontWeight: '500', letterSpacing: 1 },
  trackingTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '500', marginTop: 4 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(0, 200, 83, 0.12)' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#00C853' },
  liveBadgeText: { color: '#0B8F45', fontSize: 10, fontWeight: '500' },
  trackingMetrics: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  trackingMetric: { flex: 1 },
  trackingMetricValue: { color: colors.textPrimary, fontSize: 16, fontWeight: '500' },
  trackingMetricLabel: { color: colors.textSecondary, fontSize: 10, marginTop: 3 },
  trackingMetricDivider: { width: 1, height: 28, backgroundColor: colors.border, marginHorizontal: 12 },
  quickActions: { marginBottom: 18, padding: 14, borderRadius: 20 },
  quickActionsDark: { borderColor: darkColors.border },
  quickActionsTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '600', marginBottom: 10 },
  quickActionsRow: { flexDirection: 'row', gap: 8 },
  quickAction: { flex: 1, minHeight: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: 'rgba(236, 72, 153, 0.08)', borderWidth: 1, borderColor: 'rgba(236, 72, 153, 0.16)' },
  quickActionIcon: { color: colors.primary, fontSize: 20, lineHeight: 22 },
  quickActionText: { color: colors.textPrimary, fontSize: 10, fontWeight: '500', marginTop: 4, textAlign: 'center' },
  addRouteOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(18, 12, 25, 0.42)' },
  addRouteModal: { maxHeight: '78%', padding: 20, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: '#FFFFFF' },
  addRouteModalDark: { backgroundColor: darkColors.softSurface },
  addRouteHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 16 },
  addRouteTitle: { color: colors.textPrimary, fontSize: 21, fontWeight: '600' },
  addRouteSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  addRouteClose: { color: colors.primary, fontSize: 12, fontWeight: '600', paddingTop: 4 },
  addRouteInput: { minHeight: 48, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: '#FAF7FF', color: colors.textPrimary, fontSize: 14 },
  addRouteInputDark: { borderColor: darkColors.border, backgroundColor: darkColors.input, color: darkColors.textPrimary },
  addRouteResults: { marginTop: 12 },
  addRouteResult: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(122,92,244,0.1)' },
  addRouteResultDark: { borderBottomColor: 'rgba(255,255,255,0.08)' },
  addRouteResultIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(236,72,153,0.12)' },
  addRouteResultIconText: { color: colors.primary, fontSize: 20, fontWeight: '400' },
  addRouteResultInfo: { flex: 1 },
  addRouteResultName: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  addRouteResultMeta: { color: colors.textSecondary, fontSize: 11, marginTop: 3, textTransform: 'capitalize' },
  addRouteResultArrow: { color: colors.primary, fontSize: 24 },
  addRouteEmpty: { color: colors.textSecondary, paddingVertical: 24, textAlign: 'center', fontSize: 13 },
  shareOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(18, 12, 25, 0.42)' },
  shareModal: { maxHeight: '78%', padding: 20, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: '#FFFFFF' },
  shareModalDark: { backgroundColor: darkColors.softSurface },
  shareContactList: { marginBottom: 16 },
  shareContactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(122,92,244,0.1)' },
  shareContactRowDark: { borderBottomColor: 'rgba(255,255,255,0.08)' },
  shareContactRowSelected: { backgroundColor: 'rgba(236,72,153,0.08)' },
  shareContactCheck: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  shareContactCheckSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  shareContactCheckText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  shareContactInfo: { flex: 1 },
  shareContactName: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  shareContactMeta: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
  mapPanel: { borderRadius: 28, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: '#DCE8F2' },
  mapPanelDark: { borderColor: '#324B63' },
  mapHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  mapTitle: { color: '#1F2B3A', fontWeight: '600', fontSize: 18 },
  mapTitleDark: { color: '#E8F0FA' },
  nearMeToggle: { backgroundColor: '#E7F0F7', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#D7E7F4' },
  nearMeToggleDark: { backgroundColor: '#1F2D3D', borderColor: '#38556E' },
  nearMeText: { color: '#1F2B3A', fontSize: 11, fontWeight: '600' },
  nearMeTextDark: { color: '#E8F0FA' },
  mapSurface: {
    position: 'relative',
    height: 320,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#F3F6F7',
    borderWidth: 1,
    borderColor: '#D9E5EB',
  },
  mapSurfaceDark: { borderColor: '#2E465D' },
  mapBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#F7FAFB',
  },
  mapBackgroundDark: { backgroundColor: '#1B2834' },
  mapGrid: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E1EAF0',
  },
  mapGridDark: { borderColor: '#314A61' },
  mapSearchBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 12,
    zIndex: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2EAF2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  searchGlyph: { color: '#536776', fontSize: 18, fontWeight: '600' },
  searchText: { flex: 1, color: '#536776', fontSize: 12, fontWeight: '600' },
  darkModeToggle: {
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2EAF2',
  },
  darkModeText: { color: '#1F2B3A', fontSize: 10, fontWeight: '600' },
  mapControls: {
    position: 'absolute',
    right: 12,
    top: 12,
    gap: 8,
    zIndex: 4,
  },
  layersButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDE7EE',
    paddingHorizontal: 12,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  layersButtonDark: { backgroundColor: '#213446', borderColor: '#3A5874' },
  layersText: { color: '#1F2B3A', fontSize: 12, fontWeight: '600' },
  layersTextDark: { color: '#EAF4FF' },
  zoomStack: { gap: 8 },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE7EE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  controlButtonDark: { backgroundColor: '#213446', borderColor: '#3A5874' },
  controlText: { color: '#1F2B3A', fontSize: 22, fontWeight: '600', lineHeight: 24 },
  controlTextDark: { color: '#F3F8FF' },
  mapChipRow: {
    position: 'absolute',
    left: 12,
    top: 12,
    flexDirection: 'row',
    gap: 8,
    zIndex: 4,
  },
  mapChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2EAF2',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  mapChipDark: { backgroundColor: '#213446', borderColor: '#3A5874' },
  mapChipText: { color: '#1F2B3A', fontSize: 11, fontWeight: '600' },
  mapChipTextDark: { color: '#EAF4FF' },
  road: {
    position: 'absolute',
    borderRadius: 999,
    shadowColor: '#BBC9D2',
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 0 },
  },
  routeLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 3,
  },
  routeNode: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#7C3AED',
    marginLeft: -6,
    marginTop: -6,
  },
  routeStart: { backgroundColor: '#22C55E', borderColor: '#16A34A' },
  routeEnd: { backgroundColor: '#F59E0B', borderColor: '#D97706' },
  routeSummaryCard: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5EDF3',
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    zIndex: 4,
  },
  routeSummaryCardDark: { backgroundColor: 'rgba(25,38,48,0.9)', borderColor: '#446179' },
  routeSummaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  routeSummaryTitle: { color: '#1F2B3A', fontSize: 13, fontWeight: '600' },
  routeSummaryTitleDark: { color: '#F4FAFF' },
  routeSummaryTime: { color: '#0B7A61', fontSize: 12, fontWeight: '600' },
  routeSummaryTimeDark: { color: '#A7F3D0' },
  routeSummaryMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  routeSummaryMeta: { color: '#536776', fontSize: 11, fontWeight: '600' },
  routeSummaryMetaDark: { color: '#CAE0F3' },
  mapLabel: {
    position: 'absolute',
    color: '#6A7D8C',
    fontWeight: '600',
    letterSpacing: 0.2,
    zIndex: 2,
  },
  mapLabelDark: { color: '#C7D9E8' },
  mapLabelBig: { left: '12%', top: '14%', fontSize: 16 },
  mapLabelMedium: { left: '40%', top: '34%', fontSize: 11 },
  mapLabelSmall: { left: '18%', top: '62%', fontSize: 10 },
  marker: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  markerActive: {
    backgroundColor: '#F2EAFF',
    borderColor: '#5B3FD6',
    transform: [{ scale: 1.15 }],
  },
  markerText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  placeDetailCard: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5D9FF',
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    zIndex: 10,
  },
  placeDetailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  placeDetailName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  placeDetailMeta: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  closeDetailButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  closeDetailText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  placeDetailStats: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 8,
  },
  placeDetailActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  bottomSheetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8EEF3',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    marginTop: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  bottomSheetCardDark: { backgroundColor: darkColors.surface, borderColor: darkColors.border },
  bottomSheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#D7E0E8',
    alignSelf: 'center',
    marginBottom: 12,
  },
  bottomSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bottomSheetEyebrow: { color: colors.muted, fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  bottomSheetTitle: { color: '#1F2B3A', fontSize: 18, fontWeight: '600', marginTop: 2 },
  bottomSheetBadge: { backgroundColor: '#EAFBF5', color: '#0B7A61', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, fontWeight: '600' },
  routeSummaryList: { marginTop: 14, gap: 10 },
  routeStepRow: { flexDirection: 'row', alignItems: 'center' },
  routeStepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E', marginRight: 10 },
  routeStepDotMiddle: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#F59E0B', marginRight: 10 },
  routeStepDotEnd: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#7C3AED', marginRight: 10 },
  routeStepInfo: { flex: 1 },
  routeStepLabel: { color: colors.muted, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  routeStepText: { color: '#1F2B3A', fontSize: 13, fontWeight: '600', marginTop: 2 },
  routeStepTime: { color: '#536776', fontSize: 11, fontWeight: '600' },
  bottomSheetMeta: { color: '#536776', fontSize: 12, marginTop: 10, marginBottom: 14 },
  bottomSheetActions: { flexDirection: 'row', gap: 10 },
  label: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 10, marginTop: 12 },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  search: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    color: colors.textPrimary,
    fontSize: 14,
  },
  searchDark: { backgroundColor: darkColors.surface, borderColor: darkColors.border, color: darkColors.textPrimary },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  stopRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, padding: 16 },
  stopNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    paddingTop: 5,
  },
  stopInfo: { flex: 1, minWidth: 0 },
  stopName: { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },
  stopMeta: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: 8 },
  placeCard: { marginBottom: 12 },
  placeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  placeInfo: { flex: 1 },
  placeName: { color: colors.textPrimary, fontWeight: '600', marginBottom: 4 },
  placeMeta: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  saveButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.softLavender, alignItems: 'center', justifyContent: 'center' },
  saveIcon: { color: colors.primary, fontSize: 18 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, marginBottom: 12 },
  badge: {
    backgroundColor: '#F2EBFF',
    color: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '600',
  },
  safetyBadge: {
    backgroundColor: '#DFFAF2',
    color: '#0B7A61',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '600',
  },
  placeActions: { flexDirection: 'row', gap: 10 },
});
