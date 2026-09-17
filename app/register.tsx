import { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { mockOtpService } from '@/services/mockOtpService';
import { useTheme } from '@/context/ThemeProvider';

export default function Register() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const palette = isDark
    ? {
        background: '#0A0712',
        surface: '#161224',
        input: '#110D1D',
        border: '#3B2B55',
        text: '#F8FAFC',
        secondaryText: '#C4B5D9',
        muted: '#A895C0',
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

    setLoading(true);
    try {
      const result = await mockOtpService.sendOtp(email.trim());
      setVerificationCode(result.otp);
      setVerificationSent(true);
      Alert.alert('Verification email sent', `${result.message} OTP: ${result.otp}`);
    } catch {
      Alert.alert('Unable to send email', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = () => {
    const normalizedCode = enteredCode.trim();
    const isValid = mockOtpService.verifyOtp(normalizedCode, verificationCode);

    if (!isValid) {
      Alert.alert('Invalid verification code', 'Please check the code and try again.');
      return;
    }

    Alert.alert('Account created', 'Your account has been verified successfully.');
    router.replace('/profile-setup');
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/login');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      <LinearGradient
        colors={isDark ? ['#0A0712', '#120C1E', '#0A0712'] : ['#F5F0FF', '#F8F3FF', '#F1E8FF']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable onPress={handleBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Back to login">
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <View style={styles.logoWrap}>
            <Image source={require('@/imports/ICON.svg')} style={styles.logo} contentFit="contain" />
          </View>

          <Text accessibilityRole="header" style={[styles.title, { color: palette.text }]}>Create account</Text>
          <Text style={[styles.subtitle, { color: palette.secondaryText }]}>Set up your Pink Plug profile.</Text>

          {!verificationSent ? (
            <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
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
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
              <Text style={[styles.label, { color: palette.text }]}>Email verification</Text>
              <Text style={[styles.helperText, { color: palette.secondaryText }]}>Enter the 6-digit code sent to {email}</Text>
              <Text style={styles.demoOtp}>Demo code: {verificationCode}</Text>

              <TextInput
                value={enteredCode}
                onChangeText={setEnteredCode}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="123456"
                placeholderTextColor={palette.muted}
                style={[styles.input, { backgroundColor: palette.input, borderColor: palette.border, color: palette.text }]}
              />

              <Pressable onPress={handleVerify} style={styles.primaryButton}>
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
                <Pressable onPress={handleCreateAccount}>
                  <Text style={styles.linkText}>Resend code</Text>
                </Pressable>
                <Pressable onPress={() => setVerificationSent(false)}>
                  <Text style={styles.linkText}>Edit details</Text>
                </Pressable>
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
