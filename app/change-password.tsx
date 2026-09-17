import { useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { mockOtpService } from '@/services/mockOtpService';
import { useTheme } from '@/context/ThemeProvider';

export default function ChangePassword() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
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

    const result = await mockOtpService.sendOtp('your email or phone');
    setVerificationCode(result.otp);
    setStatus(result.message);
    setOtpSent(true);
    setOtpModalVisible(true);
  };

  const handleVerifyOtp = () => {
    if (!/^\d{6}$/.test(otpCode)) {
      setStatus('Enter the 6-digit verification code.');
      return;
    }

    if (!mockOtpService.verifyOtp(otpCode, verificationCode)) {
      setStatus('Invalid OTP. Please try again.');
      return;
    }

    setOtpModalVisible(false);
    setStatus('Password changed successfully.');
  };

  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹  Back</Text>
        </Pressable>

        <Text accessibilityRole="header" style={[styles.title, isDark && styles.darkText]}>Change password</Text>

        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.infoText, isDark && styles.darkSecondaryText]}>We’ll send a one-time verification code to your registered email or phone before updating your password.</Text>

          <Text style={[styles.label, isDark && styles.darkText]}>Current password</Text>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter your current password"
            placeholderTextColor={isDark ? '#A895C0' : colors.muted}
            secureTextEntry
            style={[styles.input, isDark && styles.inputDark]}
          />

          <Text style={[styles.label, isDark && styles.darkText]}>New password</Text>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Create a new password"
            placeholderTextColor={isDark ? '#A895C0' : colors.muted}
            secureTextEntry
            style={[styles.input, isDark && styles.inputDark]}
          />

          <Text style={[styles.label, isDark && styles.darkText]}>Confirm new password</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your new password"
            placeholderTextColor={isDark ? '#A895C0' : colors.muted}
            secureTextEntry
            style={[styles.input, isDark && styles.inputDark]}
          />

          <View style={[styles.tipBox, isDark && styles.tipBoxDark]}>
            <Text style={[styles.tipTitle, isDark && styles.darkText]}>Password tips</Text>
            <Text style={[styles.tipText, isDark && styles.darkSecondaryText]}>Use at least 8 characters with a mix of letters, numbers, and symbols.</Text>
          </View>

          {status ? <Text style={styles.status}>{status}</Text> : null}
        </View>

        <Button label={otpSent ? 'Send OTP again' : 'Send OTP'} onPress={handleSendOtp} />
      </ScrollView>

      <Modal
        visible={otpModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOtpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDark && styles.modalCardDark]}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>Enter verification code</Text>
            <Text style={[styles.modalCopy, isDark && styles.darkSecondaryText]}>Your mock OTP was sent to your registered email or phone.</Text>
            <View style={[styles.mockCodeBox, isDark && styles.mockCodeBoxDark]}>
              <Text style={[styles.mockCodeLabel, isDark && styles.darkSecondaryText]}>Mock OTP</Text>
              <Text style={[styles.mockCode, isDark && styles.darkText]}>{verificationCode}</Text>
            </View>
            <TextInput
              autoFocus
              value={otpCode}
              onChangeText={setOtpCode}
              placeholder="Enter 6-digit code"
              placeholderTextColor={isDark ? '#A895C0' : colors.muted}
              keyboardType="number-pad"
              maxLength={6}
              style={[styles.input, isDark && styles.inputDark]}
            />
            <View style={styles.modalActions}>
              <Button label="Cancel" onPress={() => setOtpModalVisible(false)} variant="secondary" style={styles.modalButton} />
              <Button label="Verify" onPress={handleVerifyOtp} style={styles.modalButton} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  safeDark: { backgroundColor: '#0A0712' },
  darkText: { color: '#F8FAFC' },
  darkSecondaryText: { color: '#C4B5D9' },
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
  inputDark: { backgroundColor: '#110D1D', borderColor: '#3B2B55', color: '#F8FAFC' },
  tipBox: {
    backgroundColor: '#F6F1FF',
    borderRadius: 16,
    padding: 12,
    marginTop: 18,
  },
  tipBoxDark: { backgroundColor: '#231A3D', borderWidth: 1, borderColor: '#3B2B55' },
  tipTitle: { color: colors.textPrimary, fontWeight: '600', fontSize: 13, marginBottom: 4 },
  tipText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  status: { marginTop: 12, color: colors.primary, fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10, 7, 18, 0.65)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 20 },
  modalCardDark: { backgroundColor: '#161224', borderColor: '#3B2B55' },
  modalTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  modalCopy: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 14 },
  mockCodeBox: { backgroundColor: '#F6F1FF', borderRadius: 14, alignItems: 'center', paddingVertical: 12, marginBottom: 14 },
  mockCodeBoxDark: { backgroundColor: '#231A3D' },
  mockCodeLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  mockCode: { color: colors.primary, fontSize: 24, fontWeight: '700', letterSpacing: 4, marginTop: 4 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalButton: { flex: 1 },
});
