import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, darkColors } from '@/constants/colors';
import { pickContactFromPhoneBook, normalizePhoneNumber } from '@/services/contacts';
import { useEmergencyContactsStore } from '@/store/useEmergencyContactsStore';
import { useTheme } from '@/context/ThemeProvider';
import GlassCard from '@/components/ui/GlassCard';

export default function EmergencyContacts() {
  const router = useRouter();
  const { isDark } = useTheme();
  const contacts = useEmergencyContactsStore((state) => state.contacts);
  const addContact = useEmergencyContactsStore((state) => state.addContact);
  const removeContact = useEmergencyContactsStore((state) => state.removeContact);
  const updateContact = useEmergencyContactsStore((state) => state.updateContact);
  const limit = useEmergencyContactsStore((state) => state.limit);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('Friend');

  const handleNativePick = async () => {
    const result = await pickContactFromPhoneBook();
    if (!result) {
      Alert.alert('No contact selected', 'Please choose a valid contact with a phone number.');
      return;
    }

    if (contacts.length >= limit) {
      Alert.alert('Limit reached', 'You can add up to 5 close contacts.');
      return;
    }

    const fullName = `${result.firstName ?? ''} ${result.lastName ?? ''}`.trim() || 'New Contact';
    const normalizedPhone = normalizePhoneNumber(result.phoneNumber);

    if (!normalizedPhone) {
      Alert.alert('Invalid contact', 'This contact does not have a valid phone number.');
      return;
    }

    addContact({
      name: fullName,
      phone: normalizedPhone,
      relationship: result.relationship ?? 'Trusted contact',
      isVerified: false,
      canReceiveSms: true,
      canReceiveCall: false,
      shareLiveLocation: false,
    });
  };

  const handleManualAdd = () => {
    const trimmedName = name.trim();
    const normalizedPhone = normalizePhoneNumber(phone);

    if (!trimmedName || !normalizedPhone) {
      Alert.alert('Missing details', 'Please enter a valid name and phone number.');
      return;
    }

    if (contacts.length >= limit) {
      Alert.alert('Limit reached', 'You can add up to 5 close contacts.');
      return;
    }

    addContact({
      name: trimmedName,
      phone: normalizedPhone,
      relationship: relationship.trim() || 'Friend',
      isVerified: false,
      canReceiveSms: true,
      canReceiveCall: false,
      shareLiveLocation: false,
    });

    setName('');
    setPhone('');
    setRelationship('Friend');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.title, isDark && styles.darkText]}>Emergency Contacts</Text>
        </View>

        <Text style={[styles.subtitle, isDark && styles.darkSecondaryText]}>Trusted people who will receive SOS notices and safety updates.</Text>

        <Pressable style={styles.primaryButton} onPress={handleNativePick}>
          <Ionicons name="people-outline" size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>Add from Phone Book</Text>
        </Pressable>

        <View style={styles.form}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Contact name"
            style={[styles.input, isDark && styles.inputDark]}
          />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
            keyboardType="phone-pad"
            style={[styles.input, isDark && styles.inputDark]}
          />
          <TextInput
            value={relationship}
            onChangeText={setRelationship}
            placeholder="Relationship"
            style={[styles.input, isDark && styles.inputDark]}
          />

          <Pressable style={styles.secondaryButton} onPress={handleManualAdd}>
            <Text style={styles.secondaryButtonText}>Add Contact</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Saved contacts</Text>
          <Text style={[styles.sectionMeta, isDark && styles.darkSecondaryText]}>{contacts.length}/{limit}</Text>
        </View>

        {contacts.length === 0 ? (
          <GlassCard level="standard" edge="subtle" style={styles.emptyCard}>
            <Text style={[styles.emptyText, isDark && styles.darkSecondaryText]}>No emergency contacts added yet.</Text>
          </GlassCard>
        ) : (
          contacts.map((contact) => (
            <GlassCard key={contact.id} level="standard" edge="subtle" style={styles.card}>
              <View style={[styles.avatar, isDark && styles.avatarDark]}>
                <Text style={styles.avatarText}>{contact.name.charAt(0).toUpperCase()}</Text>
              </View>

              <View style={styles.cardBody}>
                <Text style={[styles.name, isDark && styles.darkText]}>{contact.name}</Text>
                <Text style={[styles.relationship, isDark && styles.darkSecondaryText]}>{contact.relationship}</Text>
                <Text style={[styles.phone, isDark && styles.darkSecondaryText]}>{contact.phone}</Text>

                <View style={styles.badgeRow}>
                  <View style={[styles.badge, contact.isVerified ? styles.badgeVerified : styles.badgePending]}>
                    <Text style={styles.badgeText}>{contact.isVerified ? 'Verified' : 'Pending invite'}</Text>
                  </View>
                </View>

                <View style={styles.optionRow}>
                  <Text style={[styles.optionLabel, isDark && styles.darkSecondaryText]}>SMS alert</Text>
                  <Switch
                    value={contact.canReceiveSms}
                    onValueChange={(value) => updateContact(contact.id, { canReceiveSms: value })}
                  />
                </View>

                <View style={styles.optionRow}>
                  <Text style={[styles.optionLabel, isDark && styles.darkSecondaryText]}>Phone call alert</Text>
                  <Switch
                    value={contact.canReceiveCall}
                    onValueChange={(value) => updateContact(contact.id, { canReceiveCall: value })}
                  />
                </View>

                <View style={styles.optionRow}>
                  <Text style={[styles.optionLabel, isDark && styles.darkSecondaryText]}>Share live GPS</Text>
                  <Switch
                    value={contact.shareLiveLocation}
                    onValueChange={(value) => updateContact(contact.id, { shareLiveLocation: value })}
                  />
                </View>
              </View>

              <Pressable onPress={() => removeContact(contact.id)} style={styles.removeButton}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </GlassCard>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  darkText: { color: darkColors.textPrimary },
  darkSecondaryText: { color: darkColors.textSecondary },
  content: { padding: 20, paddingBottom: 120 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 18 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 18,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  form: { gap: 10, marginBottom: 18 },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputDark: { backgroundColor: darkColors.input, borderColor: darkColors.border, color: darkColors.textPrimary },
  secondaryButton: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: 16 },
  sectionMeta: { color: colors.muted, fontSize: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3D7FF',
  },
  avatarDark: { backgroundColor: darkColors.softSurface },
  avatarText: { color: colors.primary, fontWeight: '700' },
  cardBody: { flex: 1 },
  name: { color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
  relationship: { color: colors.muted, fontSize: 12, marginTop: 2 },
  phone: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  badgeRow: { marginTop: 8 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeVerified: { backgroundColor: '#E8F7EE' },
  badgePending: { backgroundColor: '#FFF2D6' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  optionLabel: { color: colors.textSecondary, fontSize: 12 },
  removeButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FEE7E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 18,
  },
  emptyText: { color: colors.muted, textAlign: 'center' },
});
