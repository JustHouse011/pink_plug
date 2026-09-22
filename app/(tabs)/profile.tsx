import { useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTabScreenLayout } from '@/layout/tabLayout';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, darkColors } from '@/constants/colors';
import { MOCK_USER } from '@/data/mockUser';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import { routes } from '@/navigation/routes';
import { useTheme } from '@/context/ThemeProvider';
import GlassCard from '@/components/ui/GlassCard';

export default function Profile() {
  const tabLayout = useTabScreenLayout();
  const router = useRouter();
  const [tab, setTab] = useState('Saved');
  const user = MOCK_USER;
  const { isDark } = useTheme();
  const palette = isDark ? darkColors : colors;

  return (
    <SafeAreaView edges={tabLayout.edges} style={styles.safe}>
      <ScrollView {...tabLayout.scrollProps} contentContainerStyle={[styles.content, tabLayout.contentStyle]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Avatar value={user.avatar} size={78} />
          <View style={styles.identity}>
            <Text style={[styles.name, { color: palette.textPrimary }]}>{user.name} ✓</Text>
            <Text style={[styles.meta, { color: palette.textSecondary }]}>{user.handle} · {user.city}</Text>
            <Text style={[styles.bio, { color: palette.textSecondary }]}>{user.bio}</Text>
          </View>
        </View>

        <GlassCard level="standard" gradientBorder="emphasized" style={styles.stats}>
          {[
            ['Saved', user.savedPlaces.length],
            ['Routes', 4],
            ['Reviews', 12],
            ['Following', 89],
          ].map(([label, value]) => (
            <View key={label as string} style={styles.stat}>
              <Text style={[styles.statValue, { color: palette.textPrimary }]}>{value}</Text>
              <Text style={[styles.meta, { color: palette.textSecondary }]}>{label}</Text>
            </View>
          ))}
        </GlassCard>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Safety and support"
          onPress={() => router.push(routes.safety)}
          style={[styles.safety, isDark && styles.safetyDark]}
        >
          <View style={styles.safetyIconWrap}>
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.danger} />
          </View>

          <View style={styles.identity}>
            <Text style={styles.safetyTitle}>Safety & Support</Text>
            <Text style={[styles.meta, { color: palette.textSecondary }]}>Emergency resources and community support</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={palette.textSecondary} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Emergency contacts"
          onPress={() => router.push(routes.emergencyContacts)}
          style={[styles.contacts, isDark && styles.contactsDark]}
        >
          <View style={styles.contactsIconWrap}>
            <Ionicons name="people-outline" size={24} color={colors.primary} />
          </View>

          <View style={styles.identity}>
            <Text style={[styles.contactsTitle, { color: palette.textPrimary }]}>Emergency Contacts</Text>
            <Text style={[styles.meta, { color: palette.textSecondary }]}>Trusted people for SOS notifications and check-ins</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={palette.textSecondary} />
        </Pressable>

        <View style={styles.tabs}>
          {['Saved', 'Groups', 'Activity', 'Settings'].map((item) => (
            <Chip
              key={item}
              label={item}
              active={tab === item}
              onPress={() => {
                if (item === 'Settings') {
                  router.push(routes.settings);
                  return;
                }
                setTab(item);
              }}
            />
          ))}
        </View>

        {tab === 'Saved' ? (
          user.savedPlaces.map((place) => (
            <Card key={place.id} style={styles.item}>
              <View style={styles.itemIconWrap}>
                <Ionicons name="location-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.identity}>
                <Text style={[styles.itemTitle, { color: palette.textPrimary }]}>{place.name}</Text>
                <Badge label="Community verified" />
              </View>
            </Card>
          ))
        ) : tab === 'Settings' ? (
          <Card>
            <Text style={[styles.empty, { color: palette.muted }]}>Open settings to manage your profile and security.</Text>
          </Card>
        ) : (
          <Card>
            <Text style={[styles.empty, { color: palette.muted }]}>{tab} will appear here as your community grows.</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 20, paddingBottom: 120 },
  header: { flexDirection: 'row', gap: 16, paddingVertical: 12 },
  identity: { flex: 1 },
  name: { color: colors.textPrimary, fontSize: 20, fontWeight: '600' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  bio: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 7 },
  stats: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 0,
    marginVertical: 14,
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 13 },
  statValue: { color: colors.textPrimary, fontSize: 18, fontWeight: '600' },
  safety: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FDE8E8',
    borderWidth: 1,
    borderColor: '#F7B4B4',
    marginBottom: 18,
  },
  safetyIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE4E4',
  },
  safetyDark: {
    backgroundColor: 'rgba(75, 28, 39, 0.52)',
    borderColor: 'rgba(255, 120, 120, 0.22)',
  },
  safetyTitle: { color: colors.danger, fontWeight: '600' },
  contacts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#F0E9FF',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  contactsIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3D7FF',
  },
  contactsDark: {
    backgroundColor: 'rgba(36, 27, 53, 0.62)',
    borderColor: 'rgba(168, 85, 247, 0.24)',
  },
  contactsTitle: { color: colors.textPrimary, fontWeight: '600' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 16 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  itemIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0E9FF',
  },
  itemTitle: { color: colors.textPrimary, fontWeight: '600', marginBottom: 6 },
  empty: { color: colors.muted, textAlign: 'center' },
});

