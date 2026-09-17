import { Pressable, SafeAreaView, ScrollView, Text, View, StyleSheet, Switch } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeProvider';

export default function PrivacySettings() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [profileVisible, setProfileVisible] = useState(true);
  const [showLocation, setShowLocation] = useState(false);
  const [allowMessages, setAllowMessages] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);

  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>{'‹'}  Back</Text>
        </Pressable>

        <Text accessibilityRole="header" style={[styles.title, isDark && styles.darkText]}>Privacy settings</Text>

        <View style={[styles.card, isDark && styles.cardDark]}>
          <View style={styles.rowItem}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, isDark && styles.darkText]}>Public profile</Text>
              <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Let other users see your profile</Text>
            </View>
            <Switch value={profileVisible} onValueChange={setProfileVisible} />
          </View>

          <View style={styles.rowItem}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, isDark && styles.darkText]}>Location visibility</Text>
              <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Display your city and route access</Text>
            </View>
            <Switch value={showLocation} onValueChange={setShowLocation} />
          </View>

          <View style={styles.rowItem}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, isDark && styles.darkText]}>Direct messages</Text>
              <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Allow people to contact you</Text>
            </View>
            <Switch value={allowMessages} onValueChange={setAllowMessages} />
          </View>

          <View style={styles.rowItem}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, isDark && styles.darkText]}>Data sharing</Text>
              <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Share anonymised usage analytics</Text>
            </View>
            <Switch value={dataSharing} onValueChange={setDataSharing} />
          </View>
        </View>
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
  },
  cardDark: { backgroundColor: '#161224', borderColor: '#3B2B55' },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: { flex: 1 },
  rowLabel: { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },
  rowSub: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
});

