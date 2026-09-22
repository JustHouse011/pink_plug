import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Button from '@/components/ui/Button';
import { colors, darkColors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeProvider';

const sessions = [
  { device: 'iPhone 15 Pro', location: 'Cape Town, ZA', current: true, lastSeen: 'Active now' },
  { device: 'Samsung Galaxy S24', location: 'Johannesburg, ZA', current: false, lastSeen: '2 hours ago' },
  { device: 'Google Pixel 9', location: 'Durban, ZA', current: false, lastSeen: '1 day ago' },
];

export default function ManageSessions() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [activeSessions, setActiveSessions] = useState(sessions);
  const [selectedSession, setSelectedSession] = useState<(typeof sessions)[number] | null>(null);

  const endSelectedSession = () => {
    if (!selectedSession) return;
    setActiveSessions((currentSessions) => currentSessions.filter((item) => item.device !== selectedSession.device));
    setSelectedSession(null);
  };

  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <Text style={styles.back}>{'‹'}  Back</Text>
        </Pressable>

        <Text accessibilityRole="header" style={[styles.title, isDark && styles.darkText]}>Manage active sessions</Text>

        <View style={[styles.card, isDark && styles.cardDark]}>
          {activeSessions.map((item) => (
            <Pressable
              key={item.device}
              accessibilityRole="button"
              accessibilityLabel={`Manage session for ${item.device}`}
              onPress={() => setSelectedSession(item)}
              style={({ pressed }) => [styles.sessionRow, pressed && styles.sessionRowPressed]}
            >
              <View style={styles.sessionInfo}>
                <Text style={[styles.device, isDark && styles.darkText]}>{item.device}</Text>
                <Text style={[styles.location, isDark && styles.darkSecondaryText]}>{item.location}</Text>
              </View>
              <View style={styles.sessionRight}>
                {item.current ? <Text style={styles.currentBadge}>Current</Text> : null}
                <Text style={[styles.lastSeen, isDark && styles.darkSecondaryText]}>{item.lastSeen}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <Button label="Sign out of all devices" onPress={() => {}} variant="primary" />
      </ScrollView>

      <Modal transparent visible={selectedSession !== null} animationType="fade" onRequestClose={() => setSelectedSession(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, isDark && styles.modalDark]}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>End this session</Text>
            <Text style={[styles.modalCopy, isDark && styles.darkSecondaryText]}>
              End the session on {selectedSession?.device}?
            </Text>
            <View style={styles.modalActions}>
              <Button label="Cancel" onPress={() => setSelectedSession(null)} variant="primary" style={styles.modalButton} />
              <Button label="End session" onPress={endSelectedSession} variant="danger" style={styles.modalButton} />
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 18,
  },
  cardDark: { backgroundColor: darkColors.surface, borderColor: darkColors.border },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sessionRowPressed: { opacity: 0.65 },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10, 7, 18, 0.65)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 380, backgroundColor: 'rgba(255, 255, 255, 0.78)', borderRadius: 22, padding: 20, borderWidth: 1, borderColor: colors.border },
  modalDark: { backgroundColor: darkColors.softSurface, borderColor: darkColors.border },
  modalTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  modalCopy: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 8 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  modalButton: { flex: 1 },
});

