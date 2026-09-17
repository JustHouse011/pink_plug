import { FlatList, SafeAreaView, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { MOCK_PLACES, MOCK_USER } from '@/data/mockData';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeProvider';

const directoryPeople = [
  { id: 'p-1', name: 'Lerato Khumalo', city: 'Cape Town', vibe: 'Event host', role: 'Community connector' },
  { id: 'p-2', name: 'Sipho Dlamini', city: 'Johannesburg', vibe: 'Nightlife guide', role: 'Local host' },
  { id: 'p-3', name: 'Nandi Mokoena', city: 'Durban', vibe: 'Wellness lead', role: 'Queer wellness advocate' },
  { id: 'p-4', name: 'Mpho Ndlovu', city: 'Pretoria', vibe: 'Creative network', role: 'Artist & organiser' },
];

export default function Directory() {
  const router = useRouter();
  const { isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.back} onPress={() => router.back()}>{'‹'} Directory</Text>
        <Text accessibilityRole="header" style={[styles.title, isDark && styles.darkText]}>Community Directory</Text>
        <Text style={[styles.subtitle, isDark && styles.darkSecondaryText]}>Trusted queer people and places near you.</Text>

        <Card style={styles.summary}>
          <Text style={styles.summaryLabel}>Your community</Text>
          <Text style={[styles.summaryTitle, isDark && styles.darkText]}>{MOCK_USER.city}</Text>
          <Text style={[styles.summaryCopy, isDark && styles.darkSecondaryText]}>12 verified community members are active in your area this week.</Text>
        </Card>

        <Text style={[styles.section, isDark && styles.darkText]}>People</Text>
        <View style={styles.list}>
          {directoryPeople.map((person) => (
            <Card key={person.id} style={styles.personCard}>
              <View style={styles.personHeader}>
                <View style={styles.avatarWrap}>
                  <Text style={styles.avatar}>{person.name.charAt(0)}</Text>
                </View>
                <View style={styles.personInfo}>
                  <Text style={[styles.personName, isDark && styles.darkText]}>{person.name}</Text>
                  <Text style={[styles.personMeta, isDark && styles.darkSecondaryText]}>{person.city} · {person.role}</Text>
                </View>
              </View>
              <Badge label={person.vibe} />
            </Card>
          ))}
        </View>

        <Text style={[styles.section, isDark && styles.darkText]}>Popular places</Text>
        <View style={styles.list}>
          {MOCK_PLACES.slice(0, 3).map((place) => (
            <Card key={place.id} style={styles.placeCard}>
              <Text style={[styles.placeName, isDark && styles.darkText]}>{place.name}</Text>
              <Text style={[styles.placeMeta, isDark && styles.darkSecondaryText]}>{place.address}</Text>
              <Text style={[styles.placeMeta, isDark && styles.darkSecondaryText]}>★ {place.rating} · {place.distance}</Text>
            </Card>
          ))}
        </View>

        <Button label="Explore nearby spaces" onPress={() => router.push('/(tabs)/explore')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  safeDark: { backgroundColor: '#0A0712' },
  darkText: { color: '#F8FAFC' },
  darkSecondaryText: { color: '#C4B5D9' },
  content: { padding: 20, paddingBottom: 120 },
  back: { color: colors.primary, fontSize: 18, fontWeight: '600', marginBottom: 8 },
  title: { color: colors.textPrimary, fontSize: 29, fontWeight: '600' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 4, marginBottom: 18 },
  summary: { padding: 16, marginBottom: 18 },
  summaryLabel: { color: colors.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  summaryTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '600', marginTop: 8 },
  summaryCopy: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 8 },
  section: { color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 10, marginTop: 6 },
  list: { gap: 10, marginBottom: 18 },
  personCard: { padding: 14 },
  personHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatarWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.softLavender, alignItems: 'center', justifyContent: 'center' },
  avatar: { fontSize: 18, fontWeight: '600', color: colors.primary },
  personInfo: { flex: 1 },
  personName: { color: colors.textPrimary, fontWeight: '600' },
  personMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  placeCard: { padding: 14 },
  placeName: { color: colors.textPrimary, fontWeight: '600', marginBottom: 4 },
  placeMeta: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
});

