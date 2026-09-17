import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { MOCK_PLACES } from '@/data/mockData';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import RouteMap from '@/components/route/RouteMap';
import AnimatedCard from '@/components/motion/AnimatedCard';
import AnimatedList from '@/components/motion/AnimatedList';
import { useTheme } from '@/context/ThemeProvider';
import { useAppStore } from '@/store/useAppStore';
import type { Place } from '@/types';

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

export default function Route() {
  const router = useRouter();
  const waypoints = useAppStore((state) => state.waypoints);
  const add = useAppStore((state) => state.addWaypoint);
  const remove = useAppStore((state) => state.removeWaypoint);
  const mode = useAppStore((state) => state.transitMode);
  const setMode = useAppStore((state) => state.setTransitMode);
  const { isDark, toggleTheme } = useTheme();
  const [checkedInPlace, setCheckedInPlace] = useState<Place | null>(null);
  const [checkedInAt, setCheckedInAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [routeStartedAt, setRouteStartedAt] = useState<number | null>(null);
  const [routeElapsedSeconds, setRouteElapsedSeconds] = useState(0);
  const routeDurationMinutes = 12;

  const getLocationShareMessage = (place: Place) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.coords.latitude},${place.coords.longitude}`;

    return `I’m sharing a safe Pink Route stop: ${place.name} at ${place.address}.\nLocation: ${mapsUrl}`;
  };

  const handleSharePlace = async (place: Place) => {
    const message = getLocationShareMessage(place);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.coords.latitude},${place.coords.longitude}`;

    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: place.name,
          text: message,
          url: mapsUrl,
        });
        return;
      }

      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${message}\n${mapsUrl}`);
        Alert.alert('Location copied', 'The safe-route pin is ready to paste anywhere.');
        return;
      }

      await Share.share({
        title: place.name,
        message: `${message}\n${mapsUrl}`,
      });
    } catch {
      Alert.alert('Share cancelled');
    }
  };

  const handleCheckIn = (place: Place) => {
    setCheckedInPlace(place);
    setCheckedInAt(Date.now());
    setElapsedSeconds(0);
    setSelectedPlaceId(place.id);
    Alert.alert('Checked in', `Your mock location pin is set to ${place.name}.`);
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
    setRouteStartedAt(Date.now());
    setRouteElapsedSeconds(0);
    Alert.alert('Route started', 'You are now in transit to The Pink Plug • Braamfontein.');
  };

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof categoryOptions)[number]>('All');
  const [nearMe, setNearMe] = useState(true);
  const [saved, setSaved] = useState<string[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const filteredPlaces = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return MOCK_PLACES.filter((place) => {
      const matchesCity = place.city === 'Johannesburg';
      const matchesCategory = category === 'All' || place.category === category;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        place.name.toLowerCase().includes(normalizedQuery) ||
        place.address.toLowerCase().includes(normalizedQuery);
      const matchesNearby = !nearMe || Number.parseFloat(place.distance) <= 1.1;

      return matchesCity && matchesCategory && matchesQuery && matchesNearby;
    });
  }, [category, nearMe, query]);

  const toggleSaved = (id: string) => {
    setSaved((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const visibleMarkers = filteredPlaces.filter((place) => place.city === 'Johannesburg').slice(0, 5);
  const selectedPlace = visibleMarkers.find((place) => place.id === selectedPlaceId) ?? null;

  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, isDark && styles.darkText]}>Pink Route Map</Text>
        <Text style={[styles.subtitle, isDark && styles.darkSecondaryText]}>Interactive map of queer-friendly spaces near you.</Text>

        <RouteMap
          places={visibleMarkers}
          selectedPlace={selectedPlace}
          dark={isDark}
          onDarkChange={toggleTheme}
          onSelectPlace={(place) => setSelectedPlaceId(place.id)}
          onClosePlace={() => setSelectedPlaceId(null)}
          onOpenPlace={(place) => router.push(`/places/${place.id}` as never)}
          onAddPlace={add}
          onSharePlace={handleSharePlace}
          onCheckIn={handleCheckIn}
          routeProgress={routeProgress}
        />

        {checkedInPlace && (
          <View style={[styles.checkInCard, isDark && styles.checkInCardDark]}>
            <View style={styles.checkInDot} />
            <View style={styles.checkInInfo}>
              <Text style={[styles.checkInTitle, isDark && styles.darkText]}>Checked in at {checkedInPlace.name}</Text>
              <Text style={[styles.checkInSubtitle, isDark && styles.darkSecondaryText]}>Mock location pin active</Text>
            </View>
            <Text style={styles.checkInTimer}>{formatElapsed(elapsedSeconds)}</Text>
            <Pressable onPress={() => { setCheckedInPlace(null); setCheckedInAt(null); setElapsedSeconds(0); }}>
              <Text style={styles.endCheckIn}>End</Text>
            </Pressable>
          </View>
        )}

        <AnimatedCard spring>
          <View style={[styles.bottomSheetCard, isDark && styles.bottomSheetCardDark]}>
          {routeStartedAt && (
            <View style={[styles.transitBanner, isDark && styles.transitBannerDark]}>
              <View style={styles.transitDot} />
              <View style={styles.transitInfo}>
                <Text style={[styles.transitTitle, isDark && styles.darkText]}>In transit</Text>
                <Text style={[styles.transitSubtitle, isDark && styles.darkSecondaryText]}>Heading to The Pink Plug • Braamfontein</Text>
              </View>
              <Text style={styles.transitTime}>{routeMinutesRemaining} min left</Text>
              <Pressable onPress={() => setRouteStartedAt(null)}>
                <Text style={styles.endTransit}>End</Text>
              </Pressable>
            </View>
          )}
          <View style={styles.bottomSheetHandle} />
          <View style={styles.bottomSheetHeader}>
            <View>
              <Text style={[styles.bottomSheetEyebrow, isDark && styles.darkSecondaryText]}>Pink Route</Text>
              <Text style={[styles.bottomSheetTitle, isDark && styles.darkText]}>Johannesburg queer-safe loop</Text>
            </View>
            <Text style={styles.bottomSheetBadge}>{routeStartedAt ? `${routeMinutesRemaining} min left` : '12 min'}</Text>
          </View>

          <View style={styles.routeSummaryList}>
            <View style={styles.routeStepRow}>
              <Text style={styles.routeStepDot} />
              <View style={styles.routeStepInfo}>
                <Text style={[styles.routeStepLabel, isDark && styles.darkSecondaryText]}>From</Text>
                <Text style={[styles.routeStepText, isDark && styles.darkText]}>Maboneng Precinct</Text>
              </View>
              <Text style={styles.routeStepTime}>2 min</Text>
            </View>

            <View style={styles.routeStepRow}>
              <Text style={styles.routeStepDotMiddle} />
              <View style={styles.routeStepInfo}>
                <Text style={[styles.routeStepLabel, isDark && styles.darkSecondaryText]}>Via</Text>
                <Text style={[styles.routeStepText, isDark && styles.darkText]}>Braamfontein safe corridor</Text>
              </View>
              <Text style={styles.routeStepTime}>7 min</Text>
            </View>

            <View style={styles.routeStepRow}>
              <Text style={styles.routeStepDotEnd} />
              <View style={styles.routeStepInfo}>
                <Text style={[styles.routeStepLabel, isDark && styles.darkSecondaryText]}>To</Text>
                <Text style={[styles.routeStepText, isDark && styles.darkText]}>The Pink Plug • Braamfontein</Text>
              </View>
              <Text style={styles.routeStepTime}>3 min</Text>
            </View>
          </View>

          <Text style={[styles.bottomSheetMeta, isDark && styles.darkSecondaryText]}>Starts near Maboneng • ends at Braamfontein • 1.1 km</Text>
          <View style={styles.bottomSheetActions}>
            <Button label={routeStartedAt ? 'Route in progress' : 'Start route'} variant="primary" onPress={startRoute} disabled={routeStartedAt !== null} />
            <Button label="Save plan" variant="secondary" onPress={() => {}} />
          </View>
          </View>
        </AnimatedCard>

        <Text style={[styles.label, isDark && styles.darkText]}>Travel mode</Text>
        <View style={styles.modes}>
          {(['walking', 'driving', 'transit'] as const).map((item) => (
            <Chip key={item} label={item} active={mode === item} onPress={() => setMode(item)} />
          ))}
        </View>

        <Text style={[styles.label, isDark && styles.darkText]}>Search</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search spaces, addresses, neighbourhoods"
          placeholderTextColor={colors.muted}
          style={[styles.search, isDark && styles.searchDark]}
        />

        <Text style={[styles.label, isDark && styles.darkText]}>Explore by type</Text>
        <View style={styles.categoryRow}>
          {categoryOptions.map((option) => (
            <Chip
              key={option}
              label={categoryLabels[option]}
              active={category === option}
              onPress={() => setCategory(option)}
            />
          ))}
        </View>

        <Text style={[styles.label, isDark && styles.darkText]}>Saved stops ({waypoints.length})</Text>
        <AnimatedList>
          {waypoints.length === 0 ? (
            <Card>
              <Text style={[styles.empty, isDark && styles.darkSecondaryText]}>Add trusted spaces to build your safe route.</Text>
            </Card>
          ) : (
            waypoints.map((item, index) => (
              <Card key={item.id} style={styles.stopRow}>
                <Text style={styles.stopNumber}>{index + 1}</Text>
                <View style={styles.stopInfo}>
                  <Text style={styles.stopName}>{item.place.name}</Text>
                  <Text style={styles.stopMeta}>{item.place.category} · {item.place.distance}</Text>
                </View>
                <Button label="Remove" variant="secondary" onPress={() => remove(item.id)} />
              </Card>
            ))
          )}
        </AnimatedList>

        <Text style={[styles.label, isDark && styles.darkText]}>Queer-friendly spaces</Text>
        <AnimatedList>
        {filteredPlaces.map((place) => {
          const isSaved = saved.includes(place.id);
          const isWaypoint = waypoints.some((item) => item.place.id === place.id);
          const badgeLabels = place.verifications.map((verification) => verificationLabels[verification]);

          return (
            <AnimatedCard key={place.id}>
            <Card style={styles.placeCard}>
              <View style={styles.placeHeader}>
                <View style={styles.placeInfo}>
                  <Text style={[styles.placeName, isDark && styles.darkText]}>{place.name}</Text>
                  <Text style={[styles.placeMeta, isDark && styles.darkSecondaryText]}>{place.address}</Text>
                  <Text style={[styles.placeMeta, isDark && styles.darkSecondaryText]}>★ {place.rating} · {place.reviewCount} reviews · {place.distance}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isSaved ? 'Remove saved place' : 'Save place'}
                  onPress={() => toggleSaved(place.id)}
                  style={styles.saveButton}
                >
                  <Text style={styles.saveIcon}>{isSaved ? '♥' : '♡'}</Text>
                </Pressable>
              </View>

              <View style={styles.badgeRow}>
                {badgeLabels.map((label) => (
                  <Text key={label} style={styles.badge}>
                    {label}
                  </Text>
                ))}
                <Text style={styles.safetyBadge}>🛡️ {place.safetyScore}%</Text>
              </View>

              <View style={styles.placeActions}>
                <Button
                  label={isWaypoint ? 'Added' : 'Add to route'}
                  variant="secondary"
                  onPress={() => add(place)}
                />
                <Button
                  label="Open"
                  variant="secondary"
                  onPress={() => router.push(`/places/${place.id}` as never)}
                />
              </View>
            </Card>
            </AnimatedCard>
          );
        })}
        </AnimatedList>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  safeDark: { backgroundColor: '#0A0712' },
  checkInCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18, padding: 14, borderRadius: 16, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' },
  checkInCardDark: { backgroundColor: '#132A24', borderColor: '#176B50' },
  checkInDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E' },
  checkInInfo: { flex: 1 },
  checkInTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  checkInSubtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
  checkInTimer: { color: '#16A34A', fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  endCheckIn: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  transitBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, padding: 12, borderRadius: 14, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' },
  transitBannerDark: { backgroundColor: '#132A24', borderColor: '#176B50' },
  transitDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E' },
  transitInfo: { flex: 1 },
  transitTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  transitSubtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
  transitTime: { color: '#16A34A', fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
  endTransit: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  darkText: { color: '#F8FAFC' },
  darkSecondaryText: { color: '#C4B5D9' },
  content: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: 20, paddingBottom: 120 },
  title: { color: colors.textPrimary, fontSize: 29, fontWeight: '600' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 4, marginBottom: 18 },
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
  bottomSheetCardDark: { backgroundColor: '#161224', borderColor: '#334155' },
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
  searchDark: { backgroundColor: '#161224', borderColor: '#334155', color: '#F8FAFC' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  stopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
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
  stopInfo: { flex: 1 },
  stopName: { color: colors.textPrimary, fontWeight: '600' },
  stopMeta: { color: colors.muted, fontSize: 11, marginTop: 3 },
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

