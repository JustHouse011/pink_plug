import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeProvider';
import { colors, darkColors } from '@/constants/colors';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAppStore } from '@/store/useAppStore';
import { useContactMutations, useUpdateMe, useUpdateSettings } from '@/hooks/useApi';
import * as usersService from '@/services/users';
import { ApiError, errorMessage } from '@/services/api';
import { normalizePhoneNumber } from '@/services/contacts';

const interestOptions = ['Community', 'Travel', 'Nightlife', 'Wellness', 'Events', 'Food', 'Music', 'Outdoor'];

export default function ProfileSetup() {
  const router = useRouter();
  const { isDark } = useTheme();
  const shareLocation = useAppStore((state) => state.shareLocation);
  const setLocationSharing = useAppStore((state) => state.setLocationSharing);
  const [currentStep, setCurrentStep] = useState(0);
  const [location, setLocation] = useState('Johannesburg, South Africa');
  const [locationMethod, setLocationMethod] = useState<'manual' | 'live'>('manual');
  const [locating, setLocating] = useState(false);
  const locationInputRef = useRef<TextInput>(null);
  const [interests, setInterests] = useState<string[]>(['Community', 'Events']);
  const [contacts, setContacts] = useState([{ name: '', phone: '' }]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageId, setProfileImageId] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const updateMe = useUpdateMe();
  const updateSettings = useUpdateSettings();
  const { add: addTrustedContact } = useContactMutations();

  const steps = useMemo(
    () => [
      { title: 'Where are you based?', subtitle: 'This helps us match you to nearby communities, routes, and local opportunities.' },
      { title: 'What are you into?', subtitle: 'Choose the experiences and communities that feel most like you.' },
      { title: 'Share live location', subtitle: 'Turn on live sharing for safer meetup planning and location-based recommendations.' },
      { title: 'Add trusted contacts', subtitle: 'Keep a few people close so they can support you when needed.' },
      { title: 'Upload profile photo', subtitle: 'This is the face people will see when you connect and explore.' },
    ],
    [],
  );

  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const toggleInterest = (item: string) => {
    setInterests((current) =>
      current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item],
    );
  };

  const addContact = () => {
    setContacts((current) => [...current, { name: '', phone: '' }]);
  };

  const updateContact = (index: number, field: 'name' | 'phone', value: string) => {
    setContacts((current) =>
      current.map((contact, contactIndex) =>
        contactIndex === index ? { ...contact, [field]: value } : contact,
      ),
    );
  };

  /** Reads the device position and fills the city field from it; the user can still edit the result. */
  const fillFromLiveLocation = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Location permission needed', 'Allow location access to use your live location, or enter your city manually.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync(position.coords);
      const city = place?.city ?? place?.subregion ?? place?.district ?? place?.region;
      if (!city) {
        Alert.alert('Could not find your city', 'We got your position but could not match it to a city. Please enter it manually.');
        return;
      }
      setLocation([city, place?.country].filter(Boolean).join(', '));
      setLocationMethod('live');
    } catch (error) {
      Alert.alert('Could not get your location', `${errorMessage(error)} Please enter your city manually.`);
    } finally {
      setLocating(false);
    }
  };

  const enterLocationManually = () => {
    setLocationMethod('manual');
    locationInputRef.current?.focus();
  };

  const canContinue = () => {
    if (currentStep === 0) return location.trim().length > 0 && !locating;
    if (currentStep === 1) return interests.length > 0;
    if (currentStep === 2) return true;
    if (currentStep === 3) return contacts.some((contact) => contact.name.trim() || contact.phone.trim());
    // The photo is optional, but an upload must finish before moving on.
    return !uploadingPhoto;
  };

  const pickProfilePhoto = async () => {
    if (Platform.OS !== 'web') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow access to your photos to upload a profile picture.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    const uri = result.canceled ? undefined : result.assets[0]?.uri;
    if (!uri) return;

    setProfileImage(uri);
    setUploadingPhoto(true);
    try {
      const media = await usersService.uploadMedia(uri, 'profile_photo');
      setProfileImageId(media.id);
    } catch (error) {
      setProfileImage(null);
      Alert.alert('Could not upload photo', errorMessage(error));
    } finally {
      setUploadingPhoto(false);
    }
  };

  /** Persists every step: profile fields, the location preference and trusted contacts. */
  const finishSetup = async () => {
    setFinishing(true);
    try {
      const city = location.trim().replace(/,\s*South Africa$/i, '');
      await updateMe.mutateAsync({
        city,
        interests,
        ...(profileImageId ? { profileImageId } : {}),
        profileSetupComplete: true,
      });
      await updateSettings.mutateAsync({ shareLocation });

      const failed: string[] = [];
      for (const contact of contacts) {
        const name = contact.name.trim();
        const phone = normalizePhoneNumber(contact.phone);
        if (!name || !phone) {
          if (name || contact.phone.trim()) failed.push(name || contact.phone.trim());
          continue;
        }
        try {
          await addTrustedContact.mutateAsync({ name, phone, relationship: 'Trusted contact' });
        } catch (error) {
          if (!(error instanceof ApiError && error.code === 'DUPLICATE_CONTACT')) failed.push(name);
        }
      }

      router.replace('/(tabs)/home');
      Alert.alert(
        'Profile ready',
        failed.length
          ? `Your profile is set up. These contacts could not be added: ${failed.join(', ')}. You can add them from Emergency Contacts.`
          : 'Your Pink Plug profile is set up and you are all set to explore.',
      );
    } catch (error) {
      Alert.alert('Could not finish setup', errorMessage(error));
    } finally {
      setFinishing(false);
    }
  };

  const nextStep = () => {
    if (!canContinue()) {
      Alert.alert('Complete this step', 'Please finish the current section before continuing.');
      return;
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep((step) => step + 1);
      return;
    }

    finishSetup();
  };

  const previousStep = () => {
    if (currentStep === 0) {
      router.canGoBack() ? router.back() : router.replace('/');
      return;
    }

    setCurrentStep((step) => step - 1);
  };

  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
      <LinearGradient colors={['transparent', 'transparent', 'transparent']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable onPress={previousStep} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <Text style={[styles.eyebrow, isDark && styles.darkSecondaryText]}>KYC profile setup</Text>
          <Text accessibilityRole="header" style={[styles.title, isDark && styles.darkText]}>{steps[currentStep].title}</Text>
          <Text style={[styles.subtitle, isDark && styles.darkSecondaryText]}>{steps[currentStep].subtitle}</Text>

          <View style={styles.progressWrap}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{currentStep + 1} of {totalSteps}</Text>
          </View>

          {currentStep === 0 && (
            <View style={[styles.card, isDark && styles.cardDark]}>
              <Text style={[styles.label, isDark && styles.darkText]}>Current location</Text>
              <TextInput
                ref={locationInputRef}
                placeholder="Johannesburg, South Africa"
                placeholderTextColor={colors.muted}
                value={location}
                onChangeText={(value) => {
                  setLocation(value);
                  setLocationMethod('manual');
                }}
                editable={!locating}
                autoCapitalize="words"
                style={[styles.input, isDark && styles.inputDark]}
              />

              <View style={styles.inlineToggleRow}>
                <Pressable
                  onPress={enterLocationManually}
                  style={[styles.choicePill, locationMethod === 'manual' && styles.choicePillActive]}
                >
                  <Text style={[styles.choicePillText, locationMethod === 'manual' && styles.choicePillTextActive]}>Enter manually</Text>
                </Pressable>
                <Pressable
                  onPress={fillFromLiveLocation}
                  disabled={locating}
                  style={[styles.choicePill, locationMethod === 'live' && styles.choicePillActive]}
                >
                  {locating ? <ActivityIndicator size="small" color={colors.primary} /> : null}
                  <Text style={[styles.choicePillText, locationMethod === 'live' && styles.choicePillTextActive]}>{locating ? 'Locating…' : 'Use live location'}</Text>
                </Pressable>
              </View>
            </View>
          )}

          {currentStep === 1 && (
            <View style={[styles.card, isDark && styles.cardDark]}>
              <Text style={[styles.label, isDark && styles.darkText]}>What are you into?</Text>
              <View style={styles.interestGrid}>
                {interestOptions.map((item) => {
                  const active = interests.includes(item);
                  return (
                    <Pressable
                      key={item}
                      onPress={() => toggleInterest(item)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {currentStep === 2 && (
            <View style={[styles.card, isDark && styles.cardDark]}>
              <View style={styles.locationRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, isDark && styles.darkText]}>Share live location</Text>
                  <Text style={[styles.helperText, isDark && styles.darkSecondaryText]}>Enable safe route sharing and local recommendations when you’re out exploring.</Text>
                </View>
                <Switch
                  value={shareLocation}
                  onValueChange={setLocationSharing}
                  trackColor={{ false: '#D9D2F4', true: '#A855F7' }}
                  thumbColor="#fff"
                />
              </View>

              <Pressable
                onPress={() => setLocationSharing(true)}
                style={styles.secondaryButton}
              >
                <Ionicons name="location-outline" size={18} color={colors.primary} />
                <Text style={styles.secondaryText}>Share my current location</Text>
              </Pressable>
            </View>
          )}

          {currentStep === 3 && (
            <View style={styles.card}>
              <Text style={styles.label}>Add emergency contacts</Text>
              {contacts.map((contact, index) => (
                <View key={index} style={styles.contactRow}>
                  <TextInput
                    placeholder="Contact name"
                    placeholderTextColor={colors.muted}
                    value={contact.name}
                    onChangeText={(value) => updateContact(index, 'name', value)}
                    style={[styles.input, styles.contactInput]}
                  />
                  <TextInput
                    placeholder="Phone number"
                    placeholderTextColor={colors.muted}
                    value={contact.phone}
                    onChangeText={(value) => updateContact(index, 'phone', value)}
                    keyboardType="phone-pad"
                    style={[styles.input, styles.contactInput]}
                  />
                </View>
              ))}

              <Pressable onPress={addContact} style={styles.secondaryButton}>
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.secondaryText}>Add another contact</Text>
              </Pressable>
            </View>
          )}

          {currentStep === 4 && (
            <View style={styles.card}>
              <Text style={styles.label}>Upload your profile pic</Text>
              <View style={styles.avatarWrap}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.avatar} contentFit="cover" />
                ) : (
                  <Ionicons name="person-circle-outline" size={96} color={colors.primary} />
                )}
              </View>

              <Pressable onPress={pickProfilePhoto} disabled={uploadingPhoto} style={styles.secondaryButton}>
                {uploadingPhoto ? <ActivityIndicator color={colors.primary} /> : null}
                <Text style={styles.secondaryText}>{uploadingPhoto ? 'Uploading…' : profileImage ? 'Choose a different photo' : 'Choose a photo'}</Text>
              </Pressable>
            </View>
          )}

          <Pressable onPress={nextStep} disabled={finishing} style={[styles.primaryButton, finishing && { opacity: 0.7 }]}>
            <LinearGradient
              colors={[colors.primary, '#C432D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.primaryText}>{finishing ? 'Saving…' : currentStep === totalSteps - 1 ? (profileImage ? 'Finish setup' : 'Skip photo and finish') : 'Continue'}</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  safeDark: { backgroundColor: 'transparent' }, darkText: { color: darkColors.textPrimary }, darkSecondaryText: { color: darkColors.textSecondary },
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
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  progressWrap: {
    marginBottom: 18,
  },
  progressBar: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E7DDFB',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  progressText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'right',
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
  cardDark: { backgroundColor: darkColors.surface, borderColor: darkColors.border },
  label: {
    color: colors.textPrimary,
    fontSize: 15,
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
    marginBottom: 8,
  },
  inputDark: { backgroundColor: darkColors.input, borderColor: darkColors.border, color: darkColors.textPrimary },
  interestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F4EEFF',
    borderWidth: 1,
    borderColor: '#E4DAFF',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#fff',
  },
  inlineToggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  choicePill: {
    backgroundColor: '#F5F0FF',
    borderWidth: 1,
    borderColor: '#E6D9FF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  choicePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  choicePillText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  choicePillTextActive: {
    color: '#fff',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  contactRow: {
    gap: 10,
    marginBottom: 10,
  },
  contactInput: {
    marginBottom: 0,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    marginTop: 12,
  },
  secondaryText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  avatarWrap: { alignItems: 'center', marginBottom: 12 },
  avatar: { width: 140, height: 140, borderRadius: 70, borderWidth: 3, borderColor: '#E9D8FF' },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 22,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
