import { useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { MOCK_USER } from '@/data/mockData';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/context/ThemeProvider';

export default function Settings() {
  const router = useRouter();
  const { isDark } = useTheme();
  const logout = useAppStore((state) => state.logout);
  const shareLocation = useAppStore((state) => state.shareLocation);
  const setLocationSharing = useAppStore((state) => state.setLocationSharing);
  const [user, setUser] = useState(MOCK_USER);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);
  const [selfieVerified, setSelfieVerified] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [mutePushNotifications, setMutePushNotifications] = useState(false);
  const [pushNewEvent, setPushNewEvent] = useState(true);
  const [pushCommunityReview, setPushCommunityReview] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [muteEmailNotifications, setMuteEmailNotifications] = useState(false);
  const [emailNewEvent, setEmailNewEvent] = useState(true);
  const [emailCommunityReview, setEmailCommunityReview] = useState(true);
  const [pushExpanded, setPushExpanded] = useState(false);
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [selfieVerificationStep, setSelfieVerificationStep] = useState<'idle' | 'verifying' | 'success'>('idle');
  const [deactivationPassword, setDeactivationPassword] = useState('');
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  const updateField = (field: keyof typeof user, value: string) => {
    setUser((current) => ({ ...current, [field]: value }));
  };

  const handleLogout = () => {
    logout();
    router.replace('/login' as never);
  };

  const handleDeactivate = () => {
    Alert.alert('Deactivate account?', 'You can log in again within 365 days to reactivate your account and keep all your data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Continue', style: 'destructive', onPress: () => setPasswordModalVisible(true) },
    ]);
  };

  const confirmDeactivation = () => {
    if (!deactivationPassword.trim()) {
      Alert.alert('Password required', 'Enter your password to deactivate your account.');
      return;
    }

    setPasswordModalVisible(false);
    setDeactivationPassword('');
    Alert.alert(
      'Account deactivated',
      'Your account is deactivated. You can log in again within 365 days to reactivate it, and all your data will be kept.',
      [{ text: 'OK', onPress: handleLogout }],
    );
  };

  const updateProfileImage = (uri: string) => {
    setUser((current) => ({
      ...current,
      profileImageUrl: uri,
    }));
  };

  const openWebImagePicker = (capture: 'user' | 'environment' | undefined, onComplete?: () => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (capture) input.capture = capture;
    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      const localUrl = URL.createObjectURL(file);
      updateProfileImage(localUrl);
      onComplete?.();
      target.value = '';
    };
    input.click();
  };

  const handlePickProfilePhoto = async () => {
    if (Platform.OS === 'web') {
      openWebImagePicker('environment');
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photos to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      updateProfileImage(result.assets[0].uri);
    }
  };

  const handleTakeSelfie = async (onComplete?: () => void) => {
    if (Platform.OS === 'web') {
      openWebImagePicker('user', onComplete);
      return;
    }

    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Camera access needed', 'Please allow access to your camera to take a selfie.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      updateProfileImage(result.assets[0].uri);
      onComplete?.();
    }
  };

  const handleSelfieVerification = () => {
    setSelfieVerificationStep('verifying');
    setTimeout(() => {
      setSelfieVerified(true);
      setSelfieVerificationStep('success');
    }, 1600);
  };

  const pickPhotoOptions = () => {
    Alert.alert('Profile photo', 'Choose how you want to add your photo', [
      { text: 'Upload from library', onPress: handlePickProfilePhoto },
      { text: 'Take a selfie', onPress: () => handleTakeSelfie() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.back, isDark && styles.darkText]}>‹  Back</Text>
        </Pressable>

        <Text accessibilityRole="header" style={[styles.title, isDark && styles.darkText]}>Profile settings</Text>

        <View style={styles.avatarWrap}>
          <Avatar value={user.avatar} imageUri={user.profileImageUrl} size={80} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Upload photo"
            onPress={pickPhotoOptions}
            style={styles.uploadPhotoButton}
          >
            <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
            <Text style={styles.uploadPhotoText}>Upload photo</Text>
          </Pressable>
        </View>

        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Personal details</Text>

          <Text style={[styles.label, isDark && styles.darkText]}>Full name</Text>
          <TextInput
            value={user.name}
            onChangeText={(value) => updateField('name', value)}
            style={[styles.input, isDark && styles.inputDark]}
          />

          <Text style={[styles.label, isDark && styles.darkText]}>Email</Text>
          <TextInput
            value={user.email}
            keyboardType="email-address"
            onChangeText={(value) => updateField('email', value)}
            style={[styles.input, isDark && styles.inputDark]}
          />

          <Text style={[styles.label, isDark && styles.darkText]}>Phone number</Text>
          <TextInput
            value={user.phone}
            keyboardType="phone-pad"
            onChangeText={(value) => updateField('phone', value)}
            style={[styles.input, isDark && styles.inputDark]}
          />

          <Text style={[styles.label, isDark && styles.darkText]}>Username</Text>
          <TextInput
            value={user.handle}
            onChangeText={(value) => updateField('handle', value)}
            style={[styles.input, isDark && styles.inputDark]}
          />

          <Text style={[styles.label, isDark && styles.darkText]}>City</Text>
          <TextInput
            value={user.city}
            onChangeText={(value) => updateField('city', value)}
            style={[styles.input, isDark && styles.inputDark]}
          />

          <Text style={[styles.label, isDark && styles.darkText]}>Bio</Text>
          <TextInput
            value={user.bio}
            multiline
            onChangeText={(value) => updateField('bio', value)}
            style={[styles.input, styles.textArea, isDark && styles.inputDark]}
          />
        </View>

        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Notifications</Text>

          <Pressable style={styles.notificationHeader} onPress={() => setPushExpanded((expanded) => !expanded)} accessibilityRole="button">
            <View style={styles.rowText}>
              <Text style={[styles.notificationGroupTitle, isDark && styles.darkText]}>Push Notifications</Text>
              <Text style={[styles.notificationGroupSub, isDark && styles.darkSecondaryText]}>Choose which updates appear on your device</Text>
            </View>
            <Text style={styles.notificationChevron}>{pushExpanded ? '−' : '+'}</Text>
          </Pressable>

          {pushExpanded && <View>
            <View style={styles.rowItem}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, isDark && styles.darkText]}>Enable all notifications</Text>
                <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Receive important updates and activity alerts</Text>
              </View>
              <Switch value={pushNotifications} onValueChange={(value) => { setPushNotifications(value); setPushNewEvent(value); setPushCommunityReview(value); if (value) setMutePushNotifications(false); }} />
            </View>
            <View style={styles.rowItem}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, isDark && styles.darkText]}>Mute notifications</Text>
                <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Temporarily silence push notifications</Text>
              </View>
              <Switch value={mutePushNotifications} onValueChange={(value) => { setMutePushNotifications(value); if (value) setPushNotifications(false); }} />
            </View>
            <View style={styles.rowItem}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, isDark && styles.darkText]}>New event</Text>
                <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Get notified about events near you</Text>
              </View>
              <Switch value={pushNewEvent} onValueChange={setPushNewEvent} />
            </View>
            <View style={styles.rowItem}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, isDark && styles.darkText]}>New community review</Text>
                <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Get notified when places receive reviews</Text>
              </View>
              <Switch value={pushCommunityReview} onValueChange={setPushCommunityReview} />
            </View>
          </View>}

          <Pressable style={[styles.notificationHeader, styles.emailGroupHeader]} onPress={() => setEmailExpanded((expanded) => !expanded)} accessibilityRole="button">
            <View style={styles.rowText}>
              <Text style={[styles.notificationGroupTitle, isDark && styles.darkText]}>Email Notifications</Text>
              <Text style={[styles.notificationGroupSub, isDark && styles.darkSecondaryText]}>Choose which updates are sent to your email</Text>
            </View>
            <Text style={styles.notificationChevron}>{emailExpanded ? '−' : '+'}</Text>
          </Pressable>

          {emailExpanded && <View>
            <View style={styles.rowItem}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, isDark && styles.darkText]}>Enable all notifications</Text>
                <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Receive important updates by email</Text>
              </View>
              <Switch value={emailNotifications} onValueChange={(value) => { setEmailNotifications(value); setEmailNewEvent(value); setEmailCommunityReview(value); if (value) setMuteEmailNotifications(false); }} />
            </View>
            <View style={styles.rowItem}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, isDark && styles.darkText]}>Mute notifications</Text>
                <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Temporarily silence email notifications</Text>
              </View>
              <Switch value={muteEmailNotifications} onValueChange={(value) => { setMuteEmailNotifications(value); if (value) setEmailNotifications(false); }} />
            </View>
            <View style={styles.rowItem}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, isDark && styles.darkText]}>New event</Text>
                <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Receive event updates by email</Text>
              </View>
              <Switch value={emailNewEvent} onValueChange={setEmailNewEvent} />
            </View>
            <View style={styles.rowItem}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, isDark && styles.darkText]}>New community review</Text>
                <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Receive review updates by email</Text>
              </View>
              <Switch value={emailCommunityReview} onValueChange={setEmailCommunityReview} />
            </View>
          </View>}
        </View>

        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Security</Text>

          <View style={styles.rowItem}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, isDark && styles.darkText]}>Two-factor authentication</Text>
              <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Add an extra verification step</Text>
            </View>
            <Switch value={twoFactorEnabled} onValueChange={setTwoFactorEnabled} />
          </View>

          <View style={styles.rowItem}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, isDark && styles.darkText]}>Login alerts</Text>
              <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Get notified about new sign-ins</Text>
            </View>
            <Switch value={loginAlerts} onValueChange={setLoginAlerts} />
          </View>

          <View style={styles.rowItem}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, isDark && styles.darkText]}>Profile visibility</Text>
              <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Show your profile to other users</Text>
            </View>
            <Switch value={profileVisible} onValueChange={setProfileVisible} />
          </View>

          <View style={styles.rowItem}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, isDark && styles.darkText]}>Location sharing</Text>
              <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>{shareLocation ? 'Live location is shared with route partners' : 'Share your live location when using route help'}</Text>
            </View>
            <Switch
              value={shareLocation}
              onValueChange={(value) => {
                setLocationSharing(value);
              }}
              trackColor={{ false: '#D9D2F4', true: '#A855F7' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.verificationRow}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, isDark && styles.darkText]}>Selfie verification</Text>
              <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>
                {selfieVerified ? 'Verified for this session' : 'Verify your identity with a quick selfie'}
              </Text>
            </View>
            <Button
              label={selfieVerified ? 'Verified' : 'Verify'}
              onPress={handleSelfieVerification}
              variant={selfieVerified ? 'secondary' : 'purple'}
              style={styles.verifyButton}
            />
          </View>

          <Pressable style={styles.linkRow} onPress={() => router.push('/change-password' as never)}>
            <Text style={[styles.linkText, isDark && styles.darkText]}>Change password</Text>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
          <Pressable style={styles.linkRow} onPress={() => router.push('/manage-sessions' as never)}>
            <Text style={[styles.linkText, isDark && styles.darkText]}>Manage active sessions</Text>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
          <Pressable style={styles.linkRow} onPress={() => router.push('/privacy-settings' as never)}>
            <Text style={[styles.linkText, isDark && styles.darkText]}>Privacy settings</Text>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        </View>

        <View style={[styles.section, styles.accountSection, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Account actions</Text>
          <Button label="Save changes" onPress={() => {}} style={styles.accountButton} />
          <View style={styles.actionSpacer} />
          <Button label="Log out" onPress={handleLogout} variant="purple" style={styles.accountButton} />
          <View style={styles.actionSpacer} />
          <Button label="Deactivate Account" onPress={handleDeactivate} variant="danger" style={styles.accountButton} />
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={selfieVerificationStep !== 'idle'}
        animationType="fade"
        onRequestClose={() => {
          if (selfieVerificationStep === 'success') setSelfieVerificationStep('idle');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.verificationModal, isDark && styles.sectionDark]}>
            {selfieVerificationStep === 'verifying' ? (
              <>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.modalTitle, styles.verificationTitle, isDark && styles.darkText]}>Verifying</Text>
                <Text style={[styles.modalCopy, isDark && styles.darkSecondaryText]}>We’re checking your selfie. This will only take a moment.</Text>
              </>
            ) : (
              <>
                <View style={styles.successIcon}>
                  <Text style={styles.successIconText}>✓</Text>
                </View>
                <Text style={[styles.modalTitle, styles.verificationTitle, isDark && styles.darkText]}>Selfie verified</Text>
                <Text style={[styles.modalCopy, isDark && styles.darkSecondaryText]}>Your identity was verified successfully for this session.</Text>
                <Button label="Done" onPress={() => setSelfieVerificationStep('idle')} style={styles.doneButton} />
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal transparent visible={passwordModalVisible} animationType="fade" onRequestClose={() => setPasswordModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.passwordModal, isDark && styles.sectionDark]}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>Enter your password</Text>
            <Text style={[styles.modalCopy, isDark && styles.darkSecondaryText]}>Confirm your password to deactivate your account.</Text>
            <TextInput
              value={deactivationPassword}
              onChangeText={setDeactivationPassword}
              placeholder="Password"
              placeholderTextColor={isDark ? '#A895C0' : colors.muted}
              secureTextEntry
              autoFocus
              style={[styles.input, isDark && styles.inputDark]}
            />
            <View style={styles.modalActions}>
              <Button label="Cancel" onPress={() => setPasswordModalVisible(false)} variant="secondary" style={styles.modalButton} />
              <Button label="Deactivate" onPress={confirmDeactivation} variant="danger" style={styles.modalButton} />
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
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, paddingBottom: 120 },
  back: { color: colors.primary, fontSize: 18, fontWeight: '600', marginBottom: 12 },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: '600', marginBottom: 18 },
  avatarWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.softLavender,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 30 },
  uploadPhotoButton: { minHeight: 48, paddingHorizontal: 18, borderRadius: 30, backgroundColor: '#FF8C00', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  uploadPhotoText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  section: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: 16,
    marginBottom: 18,
  },
  sectionDark: { backgroundColor: '#161224', borderColor: '#3B2B55' },
  accountSection: { alignItems: 'stretch' },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '600', marginBottom: 12 },
  label: { color: colors.textPrimary, fontWeight: '600', fontSize: 12, marginBottom: 8, marginTop: 8 },
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
  textArea: { minHeight: 92, textAlignVertical: 'top' },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: { flex: 1 },
  rowLabel: { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },
  rowSub: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  notificationHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  emailGroupHeader: { marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  notificationGroupTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 2 },
  notificationGroupSub: { color: colors.textSecondary, fontSize: 12, marginTop: 4, marginBottom: 2 },
  notificationChevron: { color: colors.primary, fontSize: 24, lineHeight: 24, paddingHorizontal: 4 },
  verificationRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  verifyButton: { minHeight: 40, paddingHorizontal: 14 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  linkText: { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },
  arrow: { color: colors.primary, fontSize: 22 },
  actionSpacer: { height: 10 },
  accountButton: { width: '100%', alignSelf: 'stretch' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10, 7, 18, 0.65)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  passwordModal: { width: '100%', maxWidth: 420, backgroundColor: '#FFFFFF', borderRadius: 22, padding: 20, borderWidth: 1, borderColor: colors.border },
  verificationModal: { width: '100%', maxWidth: 360, backgroundColor: '#FFFFFF', borderRadius: 22, padding: 24, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  modalTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  verificationTitle: { marginTop: 14, textAlign: 'center' },
  modalCopy: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 14 },
  successIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#DDF8EE', alignItems: 'center', justifyContent: 'center' },
  successIconText: { color: colors.success, fontSize: 34, fontWeight: '700' },
  doneButton: { width: '100%', marginTop: 4 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalButton: { flex: 1 },
});
