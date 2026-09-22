import { memo, useDeferredValue, useMemo, useState } from 'react';
import { FlatList, Text, TextInput, View, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTabScreenLayout } from '@/layout/tabLayout';
import { useRouter } from 'expo-router';
import NearbyCard from '@/components/home/NearbyCard';
import EventCard from '@/components/home/EventCard';
import AnimatedCard from '@/components/motion/AnimatedCard';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import SectionHeader from '@/components/ui/SectionHeader';
import { colors, darkColors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeProvider';
import { MOCK_EVENTS, MOCK_PLACES } from '@/data/mockData';
import type { Event, Place } from '@/types';
import { eventRoute, routes, placeRoute } from '@/navigation/routes';

const normalizedPlaces = MOCK_PLACES.map((place) => ({
  value: place,
  searchText: `${place.name} ${place.city} ${place.category} ${place.address}`.toLowerCase(),
}));
const normalizedEvents = MOCK_EVENTS.map((event) => ({
  value: event,
  searchText: `${event.title} ${event.venue} ${event.address} ${event.description} ${event.tags.join(' ')}`.toLowerCase(),
}));
const noop = () => undefined;

const ExplorePlaceRow = memo(function ExplorePlaceRow({ place, index, viewportHeight }: { place: Place; index: number; viewportHeight: number }) {
  const router = useRouter();
  return (
    <View style={styles.gridItem}>
      <AnimatedCard index={index} pressFeedback viewportHeight={viewportHeight}>
        <NearbyCard
          place={place}
          onToggleSave={noop}
          style={styles.gridCard}
          onPress={() => router.push(placeRoute(place.id))}
        />
      </AnimatedCard>
    </View>
  );
});

const ExploreEventRow = memo(function ExploreEventRow({ event, index, viewportHeight }: { event: Event; index: number; viewportHeight: number }) {
  const router = useRouter();
  return <AnimatedCard index={index} pressFeedback viewportHeight={viewportHeight}><EventCard event={event} style={styles.listCard} onPress={() => router.push(eventRoute(event.id))} /></AnimatedCard>;
});

function ExploreHeader({ query, setQuery, tab, setTab, isDark }: { query: string; setQuery: (value: string) => void; tab: 'spaces' | 'events'; setTab: (value: 'spaces' | 'events') => void; isDark: boolean }) {
  const router = useRouter();
  return (
    <>
      <Text style={[styles.title, isDark && styles.darkText]}>Explore</Text>
      <TextInput
        accessibilityLabel="Search spaces and events"
        value={query}
        onChangeText={setQuery}
        placeholder="Search spaces, events, people..."
        placeholderTextColor={colors.muted}
        style={[styles.search, isDark && styles.searchDark]}
      />
      <View style={styles.tabs}>
        <Chip label="Spaces" active={tab === 'spaces'} onPress={() => setTab('spaces')} />
        <Chip label="Events" active={tab === 'events'} onPress={() => setTab('events')} />
        <Chip label="Directory" active={false} onPress={() => router.push(routes.directory)} />
        <Chip label="Travel" active={false} onPress={() => router.push(routes.travel)} />
      </View>
      <SectionHeader title={tab === 'spaces' ? 'Nearby queer spaces' : 'Trending events'} />
    </>
  );
}

export default function Explore() {
  const tabLayout = useTabScreenLayout();
  const { isDark } = useTheme();
  const { height: viewportHeight } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'spaces' | 'events'>('spaces');
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const filteredPlaces = useMemo(() => normalizedPlaces.filter((item) => item.searchText.includes(deferredQuery)).map((item) => item.value), [deferredQuery]);
  const filteredEvents = useMemo(() => normalizedEvents.filter((item) => item.searchText.includes(deferredQuery)).map((item) => item.value), [deferredQuery]);
  const header = <ExploreHeader query={query} setQuery={setQuery} tab={tab} setTab={setTab} isDark={isDark} />;
  const emptyState = (
    <Card style={styles.emptyCard}>
      <Text style={[styles.emptyTitle, isDark && styles.darkText]}>No results found</Text>
      <Text style={[styles.emptyCopy, isDark && styles.darkSecondaryText]}>
        Try a different search, clear the filters, or browse all nearby spaces.
      </Text>
    </Card>
  );

  return (
    <SafeAreaView edges={tabLayout.edges} style={[styles.safe, isDark && styles.safeDark]}>
      {tab === 'spaces' ? (
        <FlatList
          {...tabLayout.scrollProps}
          key="spaces-grid"
          data={filteredPlaces}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <ExplorePlaceRow place={item} index={index} viewportHeight={viewportHeight} />}
          numColumns={2}
          columnWrapperStyle={styles.columns}
          ListHeaderComponent={header}
          ListEmptyComponent={emptyState}
          contentContainerStyle={[styles.content, tabLayout.contentStyle]}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          {...tabLayout.scrollProps}
          key="events-list"
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <ExploreEventRow event={item} index={index} viewportHeight={viewportHeight} />}
          ListHeaderComponent={header}
          ListEmptyComponent={emptyState}
          contentContainerStyle={[styles.content, tabLayout.contentStyle]}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  safeDark: { backgroundColor: 'transparent' },
  darkText: { color: darkColors.textPrimary },
  darkSecondaryText: { color: darkColors.textSecondary },
  content: { paddingHorizontal: 12, paddingTop: 20, paddingBottom: 120 },
  title: { color: colors.textPrimary, fontSize: 29, fontWeight: '600', marginBottom: 16, marginHorizontal: 8 },
  search: { height: 50, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 16, color: colors.textPrimary, fontSize: 14, marginHorizontal: 8 },
  searchDark: { backgroundColor: darkColors.surface, borderColor: darkColors.border, color: darkColors.textPrimary },
  tabs: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 18, flexWrap: 'wrap', marginHorizontal: 8 },
  columns: { gap: 12, marginBottom: 12 },
  gridItem: { flex: 1, minWidth: 0 },
  gridCard: { width: '100%', marginBottom: 0 },
  listCard: { width: '100%', marginBottom: 12 },
  emptyCard: { marginVertical: 12, paddingVertical: 20, alignItems: 'center' },
  emptyTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptyCopy: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
