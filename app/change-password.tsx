import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import { colors, darkColors } from '@/constants/colors';
import * as authService from '@/services/authService';
import { errorMessage } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/context/ThemeProvider';

export default function ChangePassword() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [maskedDestination, setMaskedDestination] = useState('');
  const [busy, setBusy] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [status, setStatus] = useState('');

  const handleSendOtp = async () => {
    if (!currentPassword.trim() || !newPassword || !confirmPassword) {
      setStatus('Please complete all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setStatus('New password must be at least 8 characters.');
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      setStatus('New password must include a lowercase letter.');
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setStatus('New password must include an uppercase letter.');
      return;
    }

    if (!/\d/.test(newPassword)) {
      setStatus('New password must include a number.');
      return;
    }

    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      setStatus('New password must include a symbol.');
      return;
    }

    if (/\s/.test(newPassword)) {
      setStatus('New password cannot contain spaces.');
      return;
    }

    if (currentPassword === newPassword) {
      setStatus('New password must be different from your current password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus('New passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      // Resend on an existing challenge; otherwise verify the current password and start one.
      const challenge = challengeId
        ? await authService.resendOtp(challengeId)
        : await authService.changePasswordChallenge(currentPassword);
      setChallengeId(challenge.challengeId);
      setMaskedDestination(challenge.maskedDestination);
      setStatus(`We sent a verification code to ${challenge.maskedDestination}.`);
      setOtpSent(true);
      setOtpCode('');
      setOtpModalVisible(true);
    } catch (error) {
      setStatus(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otpCode)) {
      setStatus('Enter the 6-digit verification code.');
      return;
    }
    if (!challengeId) return;

    setBusy(true);
    try {
      await authService.changePassword(challengeId, otpCode, newPassword);
      setOtpModalVisible(false);
      // The server revokes every session after a password change, so sign in again.
      await authService.logout();
      useAppStore.getState().logout();
      router.replace('/login');
    } catch (error) {
      setStatus(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <Text style={styles.back}>‹  Back</Text>
        </Pressable>

        <Text accessibilityRole="header" style={[styles.title, isDark && styles.darkText]}>Change password</Text>

        <GlassCard style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.infoText, isDark && styles.darkSecondaryText]}>We’ll email a one-time verification code before updating your password. You’ll be signed out everywhere afterwards.</Text>

          <Text style={[styles.label, isDark && styles.darkText]}>Current password</Text>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter your current password"
            placeholderTextColor={isDark ? darkColors.muted : colors.muted}
            secureTextEntry
            style={[styles.input, isDark && styles.inputDark]}
          />

          <Text style={[styles.label, isDark && styles.darkText]}>New password</Text>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Create a new password"
            placeholderTextColor={isDark ? darkColors.muted : colors.muted}
            secureTextEntry
            style={[styles.input, isDark && styles.inputDark]}
          />

          <Text style={[styles.label, isDark && styles.darkText]}>Confirm new password</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your new password"
            placeholderTextColor={isDark ? darkColors.muted : colors.muted}
            secureTextEntry
            style={[styles.input, isDark && styles.inputDark]}
          />

          <View style={[styles.tipBox, isDark && styles.tipBoxDark]}>
            <Text style={[styles.tipTitle, isDark && styles.darkText]}>Password tips</Text>
            <Text style={[styles.tipText, isDark && styles.darkSecondaryText]}>Use at least 8 characters with a mix of letters, numbers, and symbols.</Text>
          </View>

          {status ? <Text style={styles.status}>{status}</Text> : null}
        </GlassCard>

        <Button label={busy ? 'Please wait…' : otpSent ? 'Send code again' : 'Send code'} onPress={handleSendOtp} disabled={busy} />
      </ScrollView>

      <Modal
        visible={otpModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOtpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard intensity={35} style={[styles.modalCard, isDark && styles.modalCardDark]}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>Enter verification code</Text>
            <Text style={[styles.modalCopy, isDark && styles.darkSecondaryText]}>Enter the code we sent to {maskedDestination || 'your email'}.</Text>
            {status ? <Text style={styles.status}>{status}</Text> : null}
            <TextInput
              autoFocus
              value={otpCode}
              onChangeText={setOtpCode}
              placeholder="Enter 6-digit code"
              placeholderTextColor={isDark ? darkColors.muted : colors.muted}
              keyboardType="number-pad"
              maxLength={6}
              style={[styles.input, isDark && styles.inputDark]}
            />
            <View style={styles.modalActions}>
              <Button label="Cancel" onPress={() => setOtpModalVisible(false)} variant="secondary" style={styles.modalButton} />
              <Button label={busy ? 'Verifying…' : 'Verify'} onPress={handleVerifyOtp} disabled={busy} style={styles.modalButton} />
            </View>
          </GlassCard>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  safeDark: { backgroundColor: 'transparent' },
  darkText: { color: darkColors.textPrimary },
  darkSecondaryText: { color: darkColors.textSecondary },
  content: { padding: 20, paddingBottom: 120 },
  back: { color: colors.primary, fontSize: 18, fontWeight: '600', marginBottom: 12 },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: '600', marginBottom: 16 },
  card: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 18,
  },
  cardDark: { backgroundColor: 'transparent', borderColor: darkColors.border },
  infoText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 12 },
  label: { color: colors.textPrimary, fontWeight: '600', fontSize: 12, marginBottom: 8, marginTop: 10 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputDark: { backgroundColor: darkColors.input, borderColor: darkColors.border, color: darkColors.textPrimary },
  tipBox: {
    backgroundColor: '#F6F1FF',
    borderRadius: 16,
    padding: 12,
    marginTop: 18,
  },
  tipBoxDark: { backgroundColor: darkColors.softSurface, borderWidth: 1, borderColor: darkColors.border },
  tipTitle: { color: colors.textPrimary, fontWeight: '600', fontSize: 13, marginBottom: 4 },
  tipText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  status: { marginTop: 12, color: colors.primary, fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10, 7, 18, 0.65)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: 'transparent', borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, padding: 20 },
  modalCardDark: { backgroundColor: darkColors.surface, borderColor: darkColors.border },
  modalTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  modalCopy: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 14 },
  mockCodeBox: { backgroundColor: '#F6F1FF', borderRadius: 14, alignItems: 'center', paddingVertical: 12, marginBottom: 14 },
  mockCodeBoxDark: { backgroundColor: darkColors.softSurface },
  mockCodeLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  mockCode: { color: colors.primary, fontSize: 24, fontWeight: '700', letterSpacing: 4, marginTop: 4 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalButton: { flex: 1 },
});
