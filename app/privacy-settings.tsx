import { Pressable, ScrollView, Text, View, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadState from '@/components/ui/LoadState';
import { useSettings, useUpdateSettings } from '@/hooks/useApi';
import { errorMessage } from '@/services/api';
import { useRouter } from 'expo-router';
import { colors, darkColors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeProvider';

export default function PrivacySettings() {
  const router = useRouter();
  const { isDark } = useTheme();
  const settingsQuery = useSettings();
  const updateSettings = useUpdateSettings();
  const settings = settingsQuery.data;
  const toggle = (key: 'profileVisible' | 'showLocation' | 'allowMessages' | 'dataSharing') => (value: boolean) =>
    updateSettings.mutate({ [key]: value });

  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <Text style={styles.back}>{'‹'}  Back</Text>
        </Pressable>

        <Text accessibilityRole="header" style={[styles.title, isDark && styles.darkText]}>Privacy settings</Text>

        {!settings ? <LoadState loading={settingsQuery.isPending} error={settingsQuery.error} onRetry={() => settingsQuery.refetch()} /> : null}
        {updateSettings.error ? <Text style={styles.error}>{errorMessage(updateSettings.error)}</Text> : null}
        {settings ? <View style={[styles.card, isDark && styles.cardDark]}>
          <View style={styles.rowItem}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, isDark && styles.darkText]}>Public profile</Text>
              <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Let other users see your profile</Text>
            </View>
            <Switch value={settings.profileVisible} onValueChange={toggle('profileVisible')} />
          </View>

          <View style={styles.rowItem}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, isDark && styles.darkText]}>Location visibility</Text>
              <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Display your city and route access</Text>
            </View>
            <Switch value={settings.showLocation} onValueChange={toggle('showLocation')} />
          </View>

          <View style={styles.rowItem}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, isDark && styles.darkText]}>Direct messages</Text>
              <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Allow people to contact you</Text>
            </View>
            <Switch value={settings.allowMessages} onValueChange={toggle('allowMessages')} />
          </View>

          <View style={styles.rowItem}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, isDark && styles.darkText]}>Data sharing</Text>
              <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Share anonymised usage analytics</Text>
            </View>
            <Switch value={settings.dataSharing} onValueChange={toggle('dataSharing')} />
          </View>
        </View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  safeDark: { backgroundColor: 'transparent' }, darkText: { color: darkColors.textPrimary }, darkSecondaryText: { color: darkColors.textSecondary },
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
  cardDark: { backgroundColor: darkColors.surface, borderColor: darkColors.border },
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
  error: { color: colors.danger, fontSize: 13, marginBottom: 12 },
  rowLabel: { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },
  rowSub: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
});

