import { useMemo, useState } from 'react';
import { FlatList, SafeAreaView, Text, TextInput, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import NearbyCard from '@/components/home/NearbyCard';
import EventCard from '@/components/home/EventCard';
import Chip from '@/components/ui/Chip';
import SectionHeader from '@/components/ui/SectionHeader';
import { colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeProvider';
import { MOCK_EVENTS, MOCK_PLACES } from '@/data/mockData';
import AnimatedCard from '@/components/motion/AnimatedCard';
export default function Explore() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'spaces' | 'events'>('spaces');
  const filteredPlaces = useMemo(
    () =>
      MOCK_PLACES.filter((place) =>
        place.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  const openDirectory = () => router.push('/directory' as never);
  const openTravel = () => router.push('/travel' as never);

  const listData: Array<(typeof MOCK_PLACES)[number] | (typeof MOCK_EVENTS)[number]> =
    tab === 'spaces' ? filteredPlaces : [...MOCK_EVENTS];

  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
      <FlatList
        key={tab}
        data={listData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
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
              <Chip label="Directory" active={false} onPress={openDirectory} />
              <Chip label="Travel" active={false} onPress={openTravel} />
            </View>
            <SectionHeader title={tab === 'spaces' ? 'Nearby queer spaces' : 'Trending events'} />
          </>
        }
        renderItem={({ item }) => {
          if (tab === 'spaces') {
            const place = item as (typeof MOCK_PLACES)[number];
            return (
              <AnimatedCard className="explore-grid-motion-card">
                <NearbyCard
                  place={place}
                  onToggleSave={() => {}}
                  style={styles.gridCard}
                  onPress={() => router.push(`/places/${place.id}` as never)}
                />
              </AnimatedCard>
            );
          }

          const event = item as (typeof MOCK_EVENTS)[number];
          return (
            <AnimatedCard className="explore-list-motion-card">
              <EventCard
                event={event}
                style={styles.listCard}
                onPress={() => router.push(`/events/${event.id}` as never)}
              />
            </AnimatedCard>
          );
        }}
        numColumns={tab === 'spaces' ? 2 : 1}
        columnWrapperStyle={tab === 'spaces' ? styles.columns : undefined}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  safeDark: { backgroundColor: '#0A0712' },
  darkText: { color: '#F8FAFC' },
  content: { paddingHorizontal: 12, paddingTop: 20, paddingBottom: 120 },
  title: { color: colors.textPrimary, fontSize: 29, fontWeight: '600', marginBottom: 16, marginHorizontal: 8 },
  search: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    color: colors.textPrimary,
    fontSize: 14,
    marginHorizontal: 8,
  },
  searchDark: { backgroundColor: '#161224', borderColor: '#3B2B55', color: '#F8FAFC' },
  tabs: { flexDirection: 'row', gap: 8, marginVertical: 18, flexWrap: 'wrap', marginHorizontal: 8 },
  columns: { justifyContent: 'space-between', marginBottom: 12 },
  gridCard: { width: '100%', marginBottom: 12 },
  listCard: { width: '100%', marginBottom: 12 },
});

