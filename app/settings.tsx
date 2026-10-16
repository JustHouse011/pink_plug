import { useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, darkColors } from '@/constants/colors';
import * as authService from '@/services/authService';
import * as usersService from '@/services/users';
import { errorMessage } from '@/services/api';
import { useMe, useSettings, useUpdateMe, useUpdateSettings } from '@/hooks/useApi';
import LoadState from '@/components/ui/LoadState';
import type { User, UserSettings } from '@/types';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/context/ThemeProvider';
import { routes } from '@/navigation/routes';

function SettingsSwitch({ value, onValueChange }: { value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={[styles.toggle, value && styles.toggleActive]}
    >
      <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
    </Pressable>
  );
}

export default function Settings() {
  const router = useRouter();
  const { isDark } = useTheme();
  const logout = useAppStore((state) => state.logout);
  const meQuery = useMe();
  const updateMe = useUpdateMe();
  const settingsQuery = useSettings();
  const updateSettings = useUpdateSettings();
  const [user, setUser] = useState<User | null>(meQuery.data ?? null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Seed the editable draft once the profile has loaded.
  useEffect(() => {
    if (!user && meQuery.data) setUser(meQuery.data);
  }, [meQuery.data, user]);

  const settings = settingsQuery.data;
  const setting = (key: keyof UserSettings) => settings?.[key] ?? false;
  const patchSettings = (patch: Partial<Omit<UserSettings, 'twoFactorEnabled'>>) =>
    updateSettings.mutate(patch, { onError: (error) => Alert.alert('Could not update settings', errorMessage(error)) });
  const pushNotifications = setting('pushNotifications');
  const mutePushNotifications = setting('mutePushNotifications');
  const pushNewEvent = setting('pushNewEvent');
  const pushCommunityReview = setting('pushCommunityReview');
  const emailNotifications = setting('emailNotifications');
  const muteEmailNotifications = setting('muteEmailNotifications');
  const emailNewEvent = setting('emailNewEvent');
  const emailCommunityReview = setting('emailCommunityReview');
  const loginAlerts = setting('loginAlerts');
  const profileVisible = setting('profileVisible');
  const shareLocation = setting('shareLocation');
  const verificationStatus = meQuery.data?.verificationStatus ?? 'unverified';
  const selfieVerified = verificationStatus === 'verified';
  const [pushExpanded, setPushExpanded] = useState(false);
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [selfieVerificationStep, setSelfieVerificationStep] = useState<'idle' | 'verifying' | 'success'>('idle');
  const [deactivating, setDeactivating] = useState(false);
  const [deactivationPassword, setDeactivationPassword] = useState('');
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  const updateField = (field: 'name' | 'handle' | 'city' | 'bio', value: string) => {
    setUser((current) => (current ? { ...current, [field]: value } : current));
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const saved = await updateMe.mutateAsync({
        name: user.name.trim(),
        handle: user.handle.trim(),
        city: user.city.trim(),
        bio: user.bio.trim(),
      });
      setUser(saved);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (error) {
      Alert.alert('Could not save profile', errorMessage(error));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    authService.logout().catch(() => undefined);
    logout();
    router.replace('/login');
  };

  const handleDeactivate = () => {
    Alert.alert('Deactivate account?', 'You can log in again within 365 days to reactivate your account and keep all your data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Continue', style: 'destructive', onPress: () => setPasswordModalVisible(true) },
    ]);
  };

  const confirmDeactivation = async () => {
    if (!deactivationPassword.trim()) {
      Alert.alert('Password required', 'Enter your password to deactivate your account.');
      return;
    }

    setDeactivating(true);
    try {
      await usersService.deactivateAccount(deactivationPassword);
    } catch (error) {
      Alert.alert('Could not deactivate', errorMessage(error));
      return;
    } finally {
      setDeactivating(false);
    }

    setPasswordModalVisible(false);
    setDeactivationPassword('');
    Alert.alert(
      'Account deactivated',
      'Your account is deactivated and you have been signed out on every device.',
      [{ text: 'OK', onPress: handleLogout }],
    );
  };

  /** Uploads the picked photo, then attaches it to the profile. */
  const updateProfileImage = async (uri: string) => {
    setUploadingPhoto(true);
    try {
      const media = await usersService.uploadMedia(uri, 'profile_photo');
      const saved = await updateMe.mutateAsync({ profileImageId: media.id });
      setUser((current) => (current ? { ...current, profileImageUrl: saved.profileImageUrl } : saved));
    } catch (error) {
      Alert.alert('Could not upload photo', errorMessage(error));
    } finally {
      setUploadingPhoto(false);
    }
  };

  /** Uploads a private selfie and submits it for review. Approval happens server-side. */
  const submitSelfie = async (uri: string) => {
    setSelfieVerificationStep('verifying');
    try {
      const media = await usersService.uploadMedia(uri, 'verification_selfie');
      await usersService.submitSelfieVerification(media.id);
      await meQuery.refetch();
      setSelfieVerificationStep('success');
    } catch (error) {
      setSelfieVerificationStep('idle');
      Alert.alert('Could not submit selfie', errorMessage(error));
    }
  };

  const openWebImagePicker = (capture: 'user' | 'environment' | undefined, onPicked: (uri: string) => void = updateProfileImage) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (capture) input.capture = capture;
    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      const localUrl = URL.createObjectURL(file);
      onPicked(localUrl);
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

  const handleTakeSelfie = async (onPicked: (uri: string) => void = updateProfileImage) => {
    if (Platform.OS === 'web') {
      openWebImagePicker('user', onPicked);
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
      onPicked(result.assets[0].uri);
    }
  };

  const handleSelfieVerification = () => {
    if (verificationStatus === 'verified') {
      Alert.alert('Verified', 'Your identity has already been verified.');
      return;
    }
    if (verificationStatus === 'pending') {
      Alert.alert('In review', 'Your selfie has been submitted and is waiting for review.');
      return;
    }
    handleTakeSelfie(submitSelfie);
  };

  const pickPhotoOptions = () => {
    Alert.alert('Profile photo', 'Choose how you want to add your photo', [
      { text: 'Upload from library', onPress: handlePickProfilePhoto },
      { text: 'Take a selfie', onPress: () => handleTakeSelfie() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
        <LoadState loading={meQuery.isPending} error={meQuery.error} onRetry={() => meQuery.refetch()} style={styles.content} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
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
            {uploadingPhoto ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="camera-outline" size={18} color="#FFFFFF" />}
            <Text style={styles.uploadPhotoText}>{uploadingPhoto ? 'Uploading…' : 'Upload photo'}</Text>
          </Pressable>
        </View>

        <GlassCard style={[styles.section, isDark && styles.sectionDark]}>
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
            editable={false}
            keyboardType="email-address"
            style={[styles.input, styles.inputReadOnly, isDark && styles.inputDark]}
          />

          <Text style={[styles.label, isDark && styles.darkText]}>Phone number</Text>
          <TextInput
            value={user.phone}
            editable={false}
            keyboardType="phone-pad"
            style={[styles.input, styles.inputReadOnly, isDark && styles.inputDark]}
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
        </GlassCard>

        <GlassCard style={[styles.section, isDark && styles.sectionDark]}>
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
              <SettingsSwitch value={pushNotifications} onValueChange={(value) => patchSettings({ pushNotifications: value, pushNewEvent: value, pushCommunityReview: value, ...(value ? { mutePushNotifications: false } : {}) })} />
            </View>
            <View style={styles.rowItem}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, isDark && styles.darkText]}>Mute notifications</Text>
                <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Temporarily silence push notifications</Text>
              </View>
              <SettingsSwitch value={mutePushNotifications} onValueChange={(value) => patchSettings({ mutePushNotifications: value, ...(value ? { pushNotifications: false } : {}) })} />
            </View>
            <View style={styles.rowItem}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, isDark && styles.darkText]}>New event</Text>
                <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Get notified about events near you</Text>
              </View>
              <SettingsSwitch value={pushNewEvent} onValueChange={(value) => patchSettings({ pushNewEvent: value })} />
            </View>
            <View style={styles.rowItem}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, isDark && styles.darkText]}>New community review</Text>
                <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Get notified when places receive reviews</Text>
              </View>
              <SettingsSwitch value={pushCommunityReview} onValueChange={(value) => patchSettings({ pushCommunityReview: value })} />
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
              <SettingsSwitch value={emailNotifications} onValueChange={(value) => patchSettings({ emailNotifications: value, emailNewEvent: value, emailCommunityReview: value, ...(value ? { muteEmailNotifications: false } : {}) })} />
            </View>
            <View style={styles.rowItem}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, isDark && styles.darkText]}>Mute notifications</Text>
                <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Temporarily silence email notifications</Text>
              </View>
              <SettingsSwitch value={muteEmailNotifications} onValueChange={(value) => patchSettings({ muteEmailNotifications: value, ...(value ? { emailNotifications: false } : {}) })} />
            </View>
            <View style={styles.rowItem}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, isDark && styles.darkText]}>New event</Text>
                <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Receive event updates by email</Text>
              </View>
              <SettingsSwitch value={emailNewEvent} onValueChange={(value) => patchSettings({ emailNewEvent: value })} />
            </View>
            <View style={styles.rowItem}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, isDark && styles.darkText]}>New community review</Text>
                <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Receive review updates by email</Text>
              </View>
              <SettingsSwitch value={emailCommunityReview} onValueChange={(value) => patchSettings({ emailCommunityReview: value })} />
            </View>
          </View>}
        </GlassCard>

        <GlassCard style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Security</Text>

          <View style={styles.rowItem}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, isDark && styles.darkText]}>Two-factor authentication</Text>
              <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Always on: every sign-in needs an emailed code</Text>
            </View>
            <SettingsSwitch value onValueChange={() => Alert.alert('Always on', 'Every sign-in requires a one-time code sent to your email, so this cannot be turned off.')} />
          </View>

          <View style={styles.rowItem}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, isDark && styles.darkText]}>Login alerts</Text>
              <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Get notified about new sign-ins</Text>
            </View>
            <SettingsSwitch value={loginAlerts} onValueChange={(value) => patchSettings({ loginAlerts: value })} />
          </View>

          <View style={styles.rowItem}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, isDark && styles.darkText]}>Profile visibility</Text>
              <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>Show your profile to other users</Text>
            </View>
            <SettingsSwitch value={profileVisible} onValueChange={(value) => patchSettings({ profileVisible: value })} />
          </View>

          <View style={styles.rowItem}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, isDark && styles.darkText]}>Location sharing</Text>
              <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>{shareLocation ? 'Live location is shared with route partners' : 'Share your live location when using route help'}</Text>
            </View>
            <SettingsSwitch value={shareLocation} onValueChange={(value) => patchSettings({ shareLocation: value })} />
          </View>

          <View style={styles.verificationRow}>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, isDark && styles.darkText]}>Selfie verification</Text>
              <Text style={[styles.rowSub, isDark && styles.darkSecondaryText]}>
                {selfieVerified ? 'Your identity is verified' : verificationStatus === 'pending' ? 'Submitted, waiting for review' : 'Verify your identity with a quick selfie'}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={selfieVerified ? 'Selfie verified' : 'Verify identity with selfie'}
              onPress={handleSelfieVerification}
              style={[styles.verifyIconButton, selfieVerified && styles.verifyIconButtonDone]}
            >
              <Ionicons
                name="camera-outline"
                size={22}
                color={selfieVerified ? colors.success : '#FFFFFF'}
              />
            </Pressable>
          </View>

          <Pressable style={styles.linkRow} onPress={() => router.push(routes.changePassword)}>
            <Text style={[styles.linkText, isDark && styles.darkText]}>Change password</Text>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
          <Pressable style={styles.linkRow} onPress={() => router.push(routes.manageSessions)}>
            <Text style={[styles.linkText, isDark && styles.darkText]}>Manage active sessions</Text>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
          <Pressable style={styles.linkRow} onPress={() => router.push(routes.privacySettings)}>
            <Text style={[styles.linkText, isDark && styles.darkText]}>Privacy settings</Text>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        </GlassCard>

        <GlassCard style={[styles.section, styles.accountSection, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Account actions</Text>
          <Button label={savingProfile ? 'Saving…' : 'Save changes'} onPress={handleSaveProfile} disabled={savingProfile} style={styles.accountButton} />
          <View style={styles.actionSpacer} />
          <Button label="Log out" onPress={handleLogout} variant="purple" style={styles.accountButton} />
          <View style={styles.actionSpacer} />
          <Button label="Deactivate Account" onPress={handleDeactivate} variant="danger" style={styles.accountButton} />
        </GlassCard>
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
                <Text style={[styles.modalTitle, styles.verificationTitle, isDark && styles.darkText]}>Uploading</Text>
                <Text style={[styles.modalCopy, isDark && styles.darkSecondaryText]}>We’re securely uploading your selfie.</Text>
              </>
            ) : (
              <>
                <View style={styles.successIcon}>
                  <Text style={styles.successIconText}>✓</Text>
                </View>
                <Text style={[styles.modalTitle, styles.verificationTitle, isDark && styles.darkText]}>Selfie submitted</Text>
                <Text style={[styles.modalCopy, isDark && styles.darkSecondaryText]}>Your selfie is private and will be reviewed. Your profile shows as verified once it is approved.</Text>
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
              placeholderTextColor={isDark ? darkColors.muted : colors.muted}
              secureTextEntry
              autoFocus
              style={[styles.input, isDark && styles.inputDark]}
            />
            <View style={styles.modalActions}>
              <Button label="Cancel" onPress={() => setPasswordModalVisible(false)} variant="secondary" style={styles.modalButton} />
              <Button label={deactivating ? 'Deactivating…' : 'Deactivate'} onPress={confirmDeactivation} disabled={deactivating} variant="danger" style={styles.modalButton} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  inputReadOnly: { opacity: 0.6 },
  safe: { flex: 1, backgroundColor: 'transparent' },
  safeDark: { backgroundColor: 'transparent' },
  darkText: { color: darkColors.textPrimary },
  darkSecondaryText: { color: darkColors.textSecondary },
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
    padding: 16,
    marginBottom: 18,
  },
  sectionDark: {},
  accountSection: { alignItems: 'stretch' },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '600', marginBottom: 12 },
  label: { color: colors.textPrimary, fontWeight: '600', fontSize: 12, marginBottom: 8, marginTop: 8 },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputDark: { backgroundColor: darkColors.input, borderColor: darkColors.border, color: darkColors.textPrimary },
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
  toggle: {
    width: 34,
    height: 20,
    borderRadius: 10,
    padding: 2,
    justifyContent: 'center',
    backgroundColor: '#D9D2F4',
  },
  toggleActive: { backgroundColor: '#fffe13' },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
  },
  toggleThumbActive: {
    backgroundColor: '#ff9900',
    alignSelf: 'flex-end',
  },
  notificationHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  emailGroupHeader: { marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  notificationGroupTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 2 },
  notificationGroupSub: { color: colors.textSecondary, fontSize: 12, marginTop: 4, marginBottom: 2 },
  notificationChevron: { color: colors.primary, fontSize: 24, lineHeight: 24, paddingHorizontal: 4 },
  verificationRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  verifyIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059f2d',
  },
  verifyIconButtonDone: { backgroundColor: '#DDF8EE' },
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
  passwordModal: { width: '100%', maxWidth: 420, backgroundColor: 'rgba(255, 255, 255, 0.78)', borderRadius: 22, padding: 20, borderWidth: 1, borderColor: colors.border },
  verificationModal: { width: '100%', maxWidth: 360, backgroundColor: 'rgba(255, 255, 255, 0.78)', borderRadius: 22, padding: 24, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  modalTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  verificationTitle: { marginTop: 14, textAlign: 'center' },
  modalCopy: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 14 },
  successIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#DDF8EE', alignItems: 'center', justifyContent: 'center' },
  successIconText: { color: colors.success, fontSize: 34, fontWeight: '700' },
  doneButton: { width: '100%', marginTop: 4 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalButton: { flex: 1 },
});
