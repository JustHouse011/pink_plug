import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { MOCK_USER } from '@/data/mockData';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import { useTheme } from '@/context/ThemeProvider';

const mockActivity = [
  {
    id: 'activity-1',
    type: 'Checked in',
    title: 'The Pink Room',
    detail: 'Cape Town, Western Cape',
    timestamp: 'Today, 8:42 PM',
    icon: 'checkmark-circle-outline' as const,
    color: colors.primary,
  },
  {
    id: 'activity-2',
    type: 'Travelled to',
    title: 'Cape Town, Western Cape',
    detail: 'From Johannesburg, Gauteng',
    timestamp: 'Today, 2:15 PM',
    icon: 'navigate-outline' as const,
    color: '#8B5CF6',
  },
  {
    id: 'activity-3',
    type: 'Checked in',
    title: 'Constitution Hill',
    detail: 'Johannesburg, Gauteng',
    timestamp: 'Yesterday, 9:18 PM',
    icon: 'checkmark-circle-outline' as const,
    color: '#E85AAD',
  },
  {
    id: 'activity-4',
    type: 'Travelled to',
    title: 'Johannesburg, Gauteng',
    detail: 'From Durban, KwaZulu-Natal',
    timestamp: 'Yesterday, 4:30 PM',
    icon: 'navigate-outline' as const,
    color: '#8B5CF6',
  },
  {
    id: 'activity-5',
    type: 'Checked in',
    title: 'uShaka Marine World',
    detail: 'Durban, KwaZulu-Natal',
    timestamp: 'Sep 14, 7:56 PM',
    icon: 'checkmark-circle-outline' as const,
    color: '#E85AAD',
  },
] as const;

export default function Profile() {
  const router = useRouter();
  const [tab, setTab] = useState('Saved');
  const user = MOCK_USER;
  const { isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Avatar value={user.name.charAt(0)} imageUri={user.profileImageUrl} size={78} />
          <View style={styles.identity}>
            <Text style={[styles.name, isDark && styles.darkText]}>{user.name} ✓</Text>
            <Text style={[styles.meta, isDark && styles.darkSecondaryText]}>{user.handle} · {user.city}</Text>
            <Text style={[styles.bio, isDark && styles.darkSecondaryText]}>{user.bio}</Text>
          </View>
        </View>

        <View style={[styles.stats, isDark && styles.statsDark]}>
          {[
            ['Saved', user.savedPlaces.length],
            ['Routes', 4],
            ['Reviews', 12],
            ['Following', 89],
          ].map(([label, value]) => (
            <View key={label as string} style={styles.stat}>
              <Text style={[styles.statValue, isDark && styles.darkText]}>{value}</Text>
              <Text style={[styles.meta, isDark && styles.darkSecondaryText]}>{label}</Text>
            </View>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Safety and support"
          onPress={() => router.push('/safety')}
          style={[styles.safety, isDark && styles.safetyDark]}
        >
          <View style={styles.safetyIconWrap}>
            <Ionicons name="shield-checkmark-outline" size={24} color={isDark ? colors.primary : colors.danger} />
          </View>

          <View style={styles.identity}>
            <Text style={[styles.safetyTitle, isDark && styles.darkText]}>Safety & Support</Text>
            <Text style={[styles.meta, isDark && styles.darkSecondaryText]}>Emergency resources and community support</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={isDark ? colors.primary : colors.muted} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Emergency contacts"
          onPress={() => router.push('/emergency-contacts')}
          style={[styles.contacts, isDark && styles.contactsDark]}
        >
          <View style={styles.contactsIconWrap}>
            <Ionicons name="people-outline" size={24} color={colors.primary} />
          </View>

          <View style={styles.identity}>
            <Text style={[styles.contactsTitle, isDark && styles.darkText]}>Emergency Contacts</Text>
            <Text style={[styles.meta, isDark && styles.darkSecondaryText]}>Trusted people for SOS notifications and check-ins</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={isDark ? colors.primary : colors.muted} />
        </Pressable>

        <View style={styles.tabs}>
          {['Saved', 'Groups', 'Activity', 'Settings'].map((item) => (
            <Chip
              key={item}
              label={item}
              active={tab === item}
              onPress={() => {
                if (item === 'Settings') {
                  router.push('/settings' as never);
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
                <Text style={[styles.itemTitle, isDark && styles.darkText]}>{place.name}</Text>
                <Badge label="Community verified" />
              </View>
            </Card>
          ))
        ) : tab === 'Activity' ? (
          <View style={styles.activityList}>
            {mockActivity.map((activity, index) => (
              <View key={activity.id} style={styles.activityRow}>
                <View style={styles.activityRail}>
                  <View style={[styles.activityIcon, { backgroundColor: `${activity.color}20` }]}>
                    <Ionicons name={activity.icon} size={18} color={activity.color} />
                  </View>
                  {index < mockActivity.length - 1 && <View style={[styles.activityLine, isDark && styles.activityLineDark]} />}
                </View>
                <Card style={styles.activityCard}>
                  <View style={styles.activityHeading}>
                    <Text style={[styles.activityType, { color: activity.color }]}>{activity.type}</Text>
                    <Text style={[styles.activityTime, isDark && styles.darkSecondaryText]}>{activity.timestamp}</Text>
                  </View>
                  <Text style={[styles.activityTitle, isDark && styles.darkText]}>{activity.title}</Text>
                  <Text style={[styles.meta, isDark && styles.darkSecondaryText]}>{activity.detail}</Text>
                </Card>
              </View>
            ))}
          </View>
        ) : tab === 'Settings' ? (
          <Card>
            <Text style={styles.empty}>Open settings to manage your profile and security.</Text>
          </Card>
        ) : (
          <Card>
            <Text style={styles.empty}>{tab} will appear here as your community grows.</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  safeDark: { backgroundColor: '#0A0712' },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, paddingBottom: 120 },
  header: { flexDirection: 'row', gap: 16, paddingVertical: 12 },
  identity: { flex: 1 },
  name: { color: colors.textPrimary, fontSize: 20, fontWeight: '600' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  bio: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 7 },
  darkText: { color: '#F8FAFC' },
  darkSecondaryText: { color: '#C4B5D9' },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 14,
  },
  statsDark: { backgroundColor: '#161224', borderColor: '#3B2B55' },
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
  safetyDark: { backgroundColor: '#2B1725', borderColor: '#6B3047' },
  safetyIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE4E4',
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
  contactsDark: { backgroundColor: '#211932', borderColor: '#3B2B55' },
  contactsIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3D7FF',
  },
  contactsTitle: { color: colors.textPrimary, fontWeight: '600' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
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
  activityList: { gap: 0 },
  activityRow: { flexDirection: 'row', gap: 10 },
  activityRail: { width: 34, alignItems: 'center' },
  activityIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  activityLine: { width: 2, flex: 1, minHeight: 18, backgroundColor: '#E6DDF0' },
  activityLineDark: { backgroundColor: '#3B2B55' },
  activityCard: { flex: 1, marginBottom: 10, paddingVertical: 13 },
  activityHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  activityType: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  activityTime: { color: colors.muted, fontSize: 11 },
  activityTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', marginTop: 7 },
  empty: { color: colors.muted, textAlign: 'center' },
});

