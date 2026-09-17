import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeProvider';

const sessions = [
  { device: 'iPhone 15 Pro', location: 'Cape Town, ZA', current: true, lastSeen: 'Active now' },
  { device: 'MacBook Pro', location: 'Johannesburg, ZA', current: false, lastSeen: '2 hours ago' },
  { device: 'Chrome on Windows', location: 'Durban, ZA', current: false, lastSeen: '1 day ago' },
];

export default function ManageSessions() {
  const router = useRouter();
  const { isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>{'‹'}  Back</Text>
        </Pressable>

        <Text accessibilityRole="header" style={[styles.title, isDark && styles.darkText]}>Manage active sessions</Text>

        <View style={[styles.card, isDark && styles.cardDark]}>
          {sessions.map((item) => (
            <View key={item.device} style={styles.sessionRow}>
              <View style={styles.sessionInfo}>
                <Text style={[styles.device, isDark && styles.darkText]}>{item.device}</Text>
                <Text style={[styles.location, isDark && styles.darkSecondaryText]}>{item.location}</Text>
              </View>
              <View style={styles.sessionRight}>
                {item.current ? <Text style={styles.currentBadge}>Current</Text> : null}
                <Text style={[styles.lastSeen, isDark && styles.darkSecondaryText]}>{item.lastSeen}</Text>
              </View>
            </View>
          ))}
        </View>

        <Button label="Sign out of all devices" onPress={() => {}} variant="secondary" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  safeDark: { backgroundColor: '#0A0712' }, darkText: { color: '#F8FAFC' }, darkSecondaryText: { color: '#C4B5D9' },
  content: { padding: 20, paddingBottom: 120 },
  back: { color: colors.primary, fontSize: 18, fontWeight: '600', marginBottom: 12 },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: '600', marginBottom: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 18,
  },
  cardDark: { backgroundColor: '#161224', borderColor: '#3B2B55' },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sessionInfo: { flex: 1 },
  device: { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },
  location: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  sessionRight: { alignItems: 'flex-end' },
  currentBadge: {
    backgroundColor: '#EAFBF5',
    color: '#0B7A61',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  lastSeen: { color: colors.textSecondary, fontSize: 11 },
});

