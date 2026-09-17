import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { useAppStore } from '@/store/useAppStore';
import { mockOtpService } from '@/services/mockOtpService';
import { useTheme } from '@/context/ThemeProvider';

const AUTH_METHODS = ['Gmail', 'Apple'];

type AuthStep = 'email' | 'otp';

type OptionalMethod = 'email' | 'gmail' | 'apple' | 'biometric';

export default function Login() {
  const { isDark } = useTheme();
  const router = useRouter();
  const login = useAppStore((state) => state.login);
  const setLoggingOut = useAppStore((state) => state.setLoggingOut);
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('bongani.nombamba@email.com');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [mockOtpCode, setMockOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<OptionalMethod>('email');
  const [biometricChecking, setBiometricChecking] = useState(false);
  const palette = isDark
    ? {
        background: '#0A0712',
        surface: '#161224',
        softSurface: '#211932',
        input: '#110D1D',
        border: '#3B2B55',
        text: '#F8FAFC',
        secondaryText: '#C4B5D9',
        muted: '#A895C0',
      }
    : {
        background: colors.background,
        surface: '#FFFFFF',
        softSurface: '#F7F0FF',
        input: '#F9F5FF',
        border: colors.border,
        text: colors.textPrimary,
        secondaryText: colors.textSecondary,
        muted: colors.muted,
      };

  const showOptionalLoginAlert = (method: 'Gmail' | 'Apple' | 'Biometric') => {
    Alert.alert(
      `${method} login`,
      `Simulating ${method} authentication. You are now signing in...`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            login();
            router.replace('/(tabs)/home');
          },
        },
      ],
    );
  };

  const handleEmailLogin = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      Alert.alert('Enter a valid email address');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Enter your password');
      return;
    }

    setLoading(true);
    try {
      const result = await mockOtpService.sendOtp(trimmed);
      setOtpSent(true);
      setMockOtpCode(result.otp);
      setSelectedMethod('email');
      setStep('otp');
      Alert.alert('Verification code sent', `${result.message} OTP: ${result.otp}`);
    } catch {
      Alert.alert('Unable to send code', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    const isSixDigitOtp = /^\d{6}$/.test(otp.trim());
    const isValidOtp = mockOtpService.verifyOtp(otp) || (isSixDigitOtp && mockOtpCode.length > 0);

    if (!isValidOtp) {
      Alert.alert('Invalid OTP', 'Please check the code and try again.');
      return;
    }

    login();
    router.replace('/(tabs)/home');
  };

  const handleBiometricLogin = () => {
    setSelectedMethod('biometric');
    setBiometricChecking(true);

    setTimeout(() => {
      setBiometricChecking(false);
      login();
      router.replace('/(tabs)/home');
    }, 1800);
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('email');
      setOtp('');
      return;
    }

    router.replace('/onboarding');
  };

  useEffect(() => {
    setLoggingOut(false);
  }, [setLoggingOut]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      <LinearGradient
        colors={isDark ? ['#0A0712', '#120C1E', '#0A0712'] : ['#F5F0FF', '#F8F3FF', '#F1E8FF']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <View style={styles.logoWrap}>
            <Image source={require('@/imports/ICON.svg')} style={styles.logo} contentFit="contain" />
          </View>

          <Text accessibilityRole="header" style={[styles.title, { color: palette.text }]}>Hello!!</Text>
          <Text style={[styles.subtitle, { color: palette.secondaryText }]}>Sign in to continue to your Pink Plug account.</Text>

          {step === 'email' ? (
            <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
              <Text style={[styles.label, { color: palette.text }]}>Email address</Text>
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

              <Text style={[styles.label, { color: palette.text }]}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Enter your password"
                placeholderTextColor={palette.muted}
                style={[styles.input, { backgroundColor: palette.input, borderColor: palette.border, color: palette.text }]}
              />

              <Pressable onPress={handleEmailLogin} style={styles.primaryButton} disabled={loading}>
                <LinearGradient
                  colors={[colors.primary, '#C432D9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.primaryText}>{loading ? 'Sending...' : 'Continue'}</Text>
                </LinearGradient>
              </Pressable>

              <Pressable onPress={() => router.push('/change-password' as never)} style={styles.linkButton}>
                <Text style={styles.linkText}>Forgot password?</Text>
              </Pressable>

              <Pressable onPress={handleBiometricLogin} style={styles.biometricLink}>
                <Text style={styles.biometricText}>Use Face ID / fingerprint</Text>
              </Pressable>

              <View style={styles.registerLinkRow}>
                <Text style={[styles.registerPrompt, { color: palette.secondaryText }]}>Don’t have an account?</Text>
                <Pressable onPress={() => router.push('/register' as never)}>
                  <Text style={styles.registerLink}>Sign Up</Text>
                </Pressable>
              </View>

              <Text style={styles.optionalLabel}>Optional sign-in</Text>
              <View style={styles.providerRow}>
                {AUTH_METHODS.map((method) => {
                  const isApple = method === 'Apple';
                  const isGmail = method === 'Gmail';

                  return (
                    <Pressable
                      key={method}
                      style={[styles.providerButton, { backgroundColor: palette.softSurface, borderColor: palette.border }]}
                      onPress={() => {
                        setSelectedMethod(method.toLowerCase() as 'gmail' | 'apple');
                        showOptionalLoginAlert(method as 'Gmail' | 'Apple');
                      }}
                    >
                      <View style={styles.providerInner}>
                        <Ionicons
                          name={isApple ? 'logo-apple' : isGmail ? 'logo-google' : 'mail'}
                          size={18}
                          color={isApple ? (isDark ? '#F8FAFC' : '#111827') : '#EA4335'}
                        />
                        <Text style={[styles.providerText, { color: palette.text }]}>{method}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={[styles.label, { color: palette.text }]}>OTP verification</Text>
              <Text style={[styles.helperText, { color: palette.secondaryText }]}>
                Enter the 6-digit code sent to {email}
              </Text>
              {mockOtpCode ? (
                <Text style={styles.demoOtp}>Demo code: {mockOtpCode}</Text>
              ) : null}
              <TextInput
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="123456"
                placeholderTextColor={palette.muted}
                style={[styles.input, { backgroundColor: palette.input, borderColor: palette.border, color: palette.text }]}
              />

              <Pressable onPress={handleVerifyOtp} style={styles.primaryButton}>
                <LinearGradient
                  colors={[colors.primary, '#C432D9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.primaryText}>Verify & continue</Text>
                </LinearGradient>
              </Pressable>

              <View style={styles.secondaryRow}>
                <Pressable onPress={() => {
                  setOtp('');
                  handleEmailLogin();
                }}>
                  <Text style={styles.linkText}>Resend code</Text>
                </Pressable>
                <Pressable onPress={() => setStep('email')}>
                  <Text style={styles.linkText}>Edit email</Text>
                </Pressable>
              </View>
            </View>
          )}

          {!otpSent && (
            <Text style={styles.footNote}>Secure sign in using your trusted email account.</Text>
          )}

          {biometricChecking && (
            <View style={styles.biometricOverlay} pointerEvents="none">
                <View style={[styles.biometricSheet, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
                <View style={styles.biometricIconWrap}>
                  <Ionicons name="finger-print" size={52} color={colors.primary} />
                </View>
                <Text style={[styles.biometricTitle, { color: palette.text }]}>Face ID / Fingerprint</Text>
                <Text style={[styles.biometricSubtitle, { color: palette.secondaryText }]}>Scanning for secure access...</Text>
                <View style={styles.scanBar} />
              </View>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
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
  providerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  providerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1E8FF',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  providerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  providerText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  biometricLink: { alignItems: 'center', marginTop: 14 },
  biometricText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  optionalLabel: {
    marginTop: 18,
    marginBottom: 6,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
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
  linkButton: { alignItems: 'center', marginTop: 4 },
  linkText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  registerLinkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 18, marginBottom: 8, flexWrap: 'nowrap' },
  registerPrompt: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 0,
  },
  registerLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  footNote: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 12,
    marginTop: 18,
  },
  biometricOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(31, 15, 37, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
  },
  biometricSheet: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8DFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  biometricIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F1E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  biometricTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  biometricSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 14,
  },
  scanBar: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: '#E7DDFB',
    overflow: 'hidden',
  },
});
