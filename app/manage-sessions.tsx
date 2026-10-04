import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Button from '@/components/ui/Button';
import { colors, darkColors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeProvider';
import { useAppStore } from '@/store/useAppStore';
import * as authService from '@/services/authService';
import { ApiError, ApiNetworkError } from '@/services/api';
import type { Session } from '@/types';

const describeError = (error: unknown): string => {
  if (error instanceof ApiError) return error.message;
  if (error instanceof ApiNetworkError) return error.message;
  return 'Something went wrong. Please try again.';
};

export default function ManageSessions() {
  const router = useRouter();
  const { isDark } = useTheme();
  const logout = useAppStore((state) => state.logout);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [ending, setEnding] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await authService.listSessions();
      setSessions(items);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const endSelectedSession = async () => {
    if (!selectedSession) return;

    if (selectedSession.current) {
      setSelectedSession(null);
      Alert.alert('Sign out instead?', 'Use "Sign out of all devices" to end your current session.');
      return;
    }

    setEnding(true);
    try {
      await authService.revokeSession(selectedSession.id);
      setSessions((current) => current.filter((item) => item.id !== selectedSession.id));
      setSelectedSession(null);
    } catch (err) {
      Alert.alert('Unable to end session', describeError(err));
    } finally {
      setEnding(false);
    }
  };

  const signOutEverywhere = () => {
    Alert.alert('Sign out of all devices?', 'This ends every active session, including this one.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out everywhere',
        style: 'destructive',
        onPress: async () => {
          setSigningOutAll(true);
          try {
            await authService.revokeAllSessions();
            logout();
            router.replace('/login');
          } catch (err) {
            Alert.alert('Unable to sign out everywhere', describeError(err));
          } finally {
            setSigningOutAll(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <Text style={styles.back}>{'‹'}  Back</Text>
        </Pressable>

        <Text accessibilityRole="header" style={[styles.title, isDark && styles.darkText]}>Manage active sessions</Text>

        <View style={[styles.card, isDark && styles.cardDark]}>
          {loading ? (
            <ActivityIndicator style={styles.loader} color={colors.primary} />
          ) : error ? (
            <View>
              <Text style={[styles.location, isDark && styles.darkSecondaryText]}>{error}</Text>
              <Pressable onPress={loadSessions} style={styles.retryButton}>
                <Text style={styles.linkText}>Try again</Text>
              </Pressable>
            </View>
          ) : sessions.length === 0 ? (
            <Text style={[styles.location, isDark && styles.darkSecondaryText]}>No active sessions found.</Text>
          ) : (
            sessions.map((item) => (
              <Pressable
                key={item.id}
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
            ))
          )}
        </View>

        <Button
          label={signingOutAll ? 'Signing out…' : 'Sign out of all devices'}
          onPress={signOutEverywhere}
          variant="primary"
          disabled={signingOutAll}
        />
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
              <Button
                label={ending ? 'Ending…' : 'End session'}
                onPress={endSelectedSession}
                variant="danger"
                style={styles.modalButton}
                disabled={ending}
              />
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
  loader: { paddingVertical: 20 },
  retryButton: { marginTop: 8 },
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
  linkText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10, 7, 18, 0.65)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 380, backgroundColor: 'rgba(255, 255, 255, 0.78)', borderRadius: 22, padding: 20, borderWidth: 1, borderColor: colors.border },
  modalDark: { backgroundColor: darkColors.softSurface, borderColor: darkColors.border },
  modalTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  modalCopy: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 8 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  modalButton: { flex: 1 },
});
