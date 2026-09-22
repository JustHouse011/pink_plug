import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { colors, darkColors } from '@/constants/colors';
import { MOCK_EVENTS } from '@/data/mockData';
import { useTheme } from '@/context/ThemeProvider';

export default function EventDetail() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = MOCK_EVENTS.find((item) => item.id === id) ?? MOCK_EVENTS[0];
  const [registration, setRegistration] = useState({ name: '', email: '', phone: '' });
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);

  const handleRegister = () => {
    if (!registration.name.trim() || !registration.email.trim() || !registration.phone.trim()) return;
    setRegistrationSubmitted(true);
  };

  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <Text style={styles.back}>‹  Back</Text>
        </Pressable>
        <Image
          source={typeof event.imageUrl === 'string' ? { uri: event.imageUrl } : event.imageUrl}
          style={styles.hero}
          contentFit="cover"
        />
        <Badge label={event.type} />
        <Text style={[styles.title, isDark && styles.darkText]}>{event.title}</Text>
        <Text style={[styles.meta, isDark && styles.darkSecondaryText]}>📅 {event.date} · {event.time}</Text>
        <Text style={[styles.meta, isDark && styles.darkSecondaryText]}>📍 {event.venue}, {event.address}</Text>
        <Text style={styles.price}>{event.price}</Text>

        <Text style={[styles.section, isDark && styles.darkText]}>About this event</Text>
        {event.descriptionHeading ? (
          <Text style={[styles.descriptionHeading, isDark && styles.darkText]}>{event.descriptionHeading}</Text>
        ) : null}
        {event.descriptionLead ? (
          <Text style={[styles.descriptionLead, isDark && styles.darkSecondaryText]}>{event.descriptionLead}</Text>
        ) : null}
        <Text style={[styles.copy, isDark && styles.darkSecondaryText]}>{event.description}</Text>

        <Text style={[styles.section, isDark && styles.darkText]}>Register for this event</Text>
        {registrationSubmitted ? (
          <Text style={styles.registrationSuccess}>You are registered for {event.title}.</Text>
        ) : (
          <View style={styles.registrationForm}>
            <TextInput
              value={registration.name}
              onChangeText={(name) => setRegistration((current) => ({ ...current, name }))}
              placeholder="Full name"
              placeholderTextColor={isDark ? darkColors.muted : colors.muted}
              style={[styles.registrationInput, isDark && styles.registrationInputDark]}
            />
            <TextInput
              value={registration.email}
              onChangeText={(email) => setRegistration((current) => ({ ...current, email }))}
              placeholder="Email address"
              placeholderTextColor={isDark ? darkColors.muted : colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.registrationInput, isDark && styles.registrationInputDark]}
            />
            <TextInput
              value={registration.phone}
              onChangeText={(phone) => setRegistration((current) => ({ ...current, phone }))}
              placeholder="Phone number"
              placeholderTextColor={isDark ? darkColors.muted : colors.muted}
              keyboardType="phone-pad"
              style={[styles.registrationInput, isDark && styles.registrationInputDark]}
            />
            <Button label="Register now" onPress={handleRegister} disabled={!registration.name.trim() || !registration.email.trim() || !registration.phone.trim()} />
          </View>
        )}

        <Text style={[styles.section, isDark && styles.darkText]}>Hosted by {event.organiser}</Text>
        <Text style={[styles.copy, isDark && styles.darkSecondaryText]}>{event.attendees.toLocaleString()} people are attending.</Text>

        <Button
          label="Open event directions"
          onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(event.address)}`)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  safeDark: { backgroundColor: 'transparent' }, darkText: { color: darkColors.textPrimary }, darkSecondaryText: { color: darkColors.textSecondary },
  content: { padding: 20, paddingBottom: 60 },
  back: { color: colors.primary, fontSize: 18, fontWeight: '600', marginBottom: 12 },
  hero: { width: '100%', height: 240, borderRadius: 24, marginBottom: 14 },
  title: { color: colors.textPrimary, fontSize: 27, fontWeight: '600', marginTop: 12 },
  meta: { color: colors.textSecondary, fontSize: 13, marginTop: 7 },
  price: { color: colors.success, fontSize: 18, fontWeight: '600', marginTop: 14 },
  section: { color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginTop: 24, marginBottom: 7 },
  descriptionHeading: { color: colors.textPrimary, fontSize: 18, lineHeight: 24, fontWeight: '700', marginBottom: 10 },
  descriptionLead: { color: colors.primary, fontSize: 14, lineHeight: 21, fontStyle: 'italic', marginBottom: 12 },
  copy: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
  registrationForm: { gap: 10, marginTop: 4 },
  registrationInput: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.textPrimary, fontSize: 14 },
  registrationInputDark: { backgroundColor: darkColors.input, borderColor: darkColors.border, color: darkColors.textPrimary },
  registrationSuccess: { color: colors.primary, fontSize: 14, lineHeight: 21, fontWeight: '600', marginTop: 4 },
});
