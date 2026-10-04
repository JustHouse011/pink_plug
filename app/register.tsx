import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Logo from '@/imports/ICON.svg';
import { useRouter } from 'expo-router';
import { colors, darkColors } from '@/constants/colors';
import GlassCard from '@/components/ui/GlassCard';
import { useAppStore } from '@/store/useAppStore';
import * as authService from '@/services/authService';
import { ApiError, ApiNetworkError } from '@/services/api';
import { useTheme } from '@/context/ThemeProvider';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,128}$/;

export default function Register() {
  const { isDark } = useTheme();
  const router = useRouter();
  const login = useAppStore((state) => state.login);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [challengeId, setChallengeId] = useState('');
  const [maskedDestination, setMaskedDestination] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const palette = isDark
    ? {
        background: darkColors.background,
        surface: darkColors.surface,
        input: darkColors.input,
        border: darkColors.border,
        text: darkColors.textPrimary,
        secondaryText: darkColors.textSecondary,
        muted: darkColors.muted,
      }
    : {
        background: colors.background,
        surface: '#FFFFFF',
        input: '#F9F5FF',
        border: colors.border,
        text: colors.textPrimary,
        secondaryText: colors.textSecondary,
        muted: colors.muted,
      };

  const describeError = (error: unknown): string => {
    if (error instanceof ApiError) return error.message;
    if (error instanceof ApiNetworkError) return error.message;
    return 'Something went wrong. Please try again.';
  };

  const handleCreateAccount = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your first name.');
      return;
    }

    if (!surname.trim()) {
      Alert.alert('Surname required', 'Please enter your surname.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Valid email required', 'Please enter a valid email address.');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Phone number required', 'Please enter your phone number.');
      return;
    }

    if (!PASSWORD_PATTERN.test(password)) {
      Alert.alert('Choose a stronger password', 'Use 8-128 characters with an uppercase letter, a lowercase letter, a number, a symbol, and no spaces.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords don’t match', 'Please re-enter your password.');
      return;
    }

    setLoading(true);
    try {
      const challenge = await authService.register({
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      setChallengeId(challenge.challengeId);
      setMaskedDestination(challenge.maskedDestination);
      setVerificationSent(true);
      setEnteredCode('');
    } catch (error) {
      Alert.alert('Unable to create account', describeError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const normalizedCode = enteredCode.trim();
    if (!/^\d{6}$/.test(normalizedCode)) {
      Alert.alert('Invalid verification code', 'Please check the code and try again.');
      return;
    }

    setVerifying(true);
    try {
      const { user, session } = await authService.verifyOtp(challengeId, normalizedCode);
      login(user, session);
      router.replace('/profile-setup');
    } catch (error) {
      Alert.alert('Unable to verify code', describeError(error));
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    try {
      const challenge = await authService.resendOtp(challengeId);
      setMaskedDestination(challenge.maskedDestination);
      Alert.alert('Code resent', `We sent a new code to ${challenge.maskedDestination}.`);
    } catch (error) {
      Alert.alert('Unable to resend code', describeError(error));
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.canGoBack() ? router.back() : router.replace('/');
      return;
    }

    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={['transparent', 'transparent', 'transparent']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable onPress={handleBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Back to login">
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <View style={styles.logoWrap}>
            <Logo width={styles.logo.width} height={styles.logo.height} />
          </View>

          <Text accessibilityRole="header" style={[styles.title, { color: palette.text }]}>Create account</Text>
          <Text style={[styles.subtitle, { color: palette.secondaryText }]}>Set up your Pink Plug profile.</Text>

          {!verificationSent ? (
            <GlassCard style={[styles.card, { borderColor: palette.border }]}> 
              <Text style={[styles.label, { color: palette.text }]}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                placeholder="Enter your name"
                placeholderTextColor={palette.muted}
                style={[styles.input, { backgroundColor: palette.input, borderColor: palette.border, color: palette.text }]}
              />

              <Text style={[styles.label, { color: palette.text }]}>Surname</Text>
              <TextInput
                value={surname}
                onChangeText={setSurname}
                autoCapitalize="words"
                placeholder="Enter your surname"
                placeholderTextColor={palette.muted}
                style={[styles.input, { backgroundColor: palette.input, borderColor: palette.border, color: palette.text }]}
              />

              <Text style={[styles.label, { color: palette.text }]}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor={palette.muted}
                style={[styles.input, { backgroundColor: palette.input, borderColor: palette.border, color: palette.text }]}
              />

              <Text style={[styles.label, { color: palette.text }]}>Phone number</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+27 82 123 4567"
                placeholderTextColor={palette.muted}
                style={[styles.input, { backgroundColor: palette.input, borderColor: palette.border, color: palette.text }]}
              />

              <Text style={[styles.label, { color: palette.text }]}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="At least 8 characters"
                placeholderTextColor={palette.muted}
                style={[styles.input, { backgroundColor: palette.input, borderColor: palette.border, color: palette.text }]}
              />
              <Text style={[styles.helperText, { color: palette.secondaryText }]}>
                Use 8+ characters with an uppercase letter, a lowercase letter, a number, and a symbol.
              </Text>

              <Text style={[styles.label, { color: palette.text }]}>Confirm password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Re-enter your password"
                placeholderTextColor={palette.muted}
                style={[styles.input, { backgroundColor: palette.input, borderColor: palette.border, color: palette.text }]}
              />

              <Pressable onPress={handleCreateAccount} style={styles.primaryButton} disabled={loading}>
                <LinearGradient
                  colors={[colors.primary, '#C432D9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.primaryText}>{loading ? 'Sending...' : 'Send verification email'}</Text>
                </LinearGradient>
              </Pressable>
            </GlassCard>
          ) : (
            <GlassCard style={[styles.card, { borderColor: palette.border }]}> 
              <Text style={[styles.label, { color: palette.text }]}>Email verification</Text>
              <Text style={[styles.helperText, { color: palette.secondaryText }]}>Enter the 6-digit code sent to {maskedDestination || email}</Text>

              <TextInput
                value={enteredCode}
                onChangeText={setEnteredCode}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="123456"
                placeholderTextColor={palette.muted}
                style={[styles.input, { backgroundColor: palette.input, borderColor: palette.border, color: palette.text }]}
              />

              <Pressable onPress={handleVerify} style={styles.primaryButton} disabled={verifying}>
                <LinearGradient
                  colors={[colors.primary, '#C432D9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.primaryText}>{verifying ? 'Verifying...' : 'Verify & continue'}</Text>
                </LinearGradient>
              </Pressable>

              <View style={styles.secondaryRow}>
                <Pressable onPress={handleResendCode}>
                  <Text style={styles.linkText}>Resend code</Text>
                </Pressable>
                <Pressable onPress={() => setVerificationSent(false)}>
                  <Text style={styles.linkText}>Edit details</Text>
                </Pressable>
              </View>
            </GlassCard>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  gradient: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 36,
    justifyContent: 'center',
  },
  backButton: { marginBottom: 18, alignSelf: 'flex-start' },
  backText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  logoWrap: { alignItems: 'center', marginBottom: 18 },
  logo: { width: 72, height: 72 },
  title: {
    color: colors.textPrimary,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'transparent',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 8,
  },
  demoOtp: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F9F5FF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 18,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  linkText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
