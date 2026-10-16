import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { colors, darkColors } from '@/constants/colors';
import LoadState from '@/components/ui/LoadState';
import ReviewSection from '@/components/reviews/ReviewSection';
import { useCreateReview, useEvent, useRegisterForEvent } from '@/hooks/useApi';
import { ApiError, errorMessage } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/context/ThemeProvider';

export default function EventDetail() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAppStore((state) => state.user);
  const eventQuery = useEvent(id);
  const register = useRegisterForEvent(id ?? '');
  const createReview = useCreateReview('event', id ?? '');
  const [registration, setRegistration] = useState({ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' });
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const event = eventQuery.data;

  const back = (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
      <Text style={styles.back}>‹  Back</Text>
    </Pressable>
  );

  if (!event) {
    return (
      <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
        <View style={styles.content}>
          {back}
          <LoadState loading={eventQuery.isPending} error={eventQuery.error} onRetry={() => eventQuery.refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  const handleRegister = () => {
    if (!registration.name.trim() || !registration.email.trim() || !registration.phone.trim()) return;
    setRegistrationError(null);
    register.mutate(
      { name: registration.name.trim(), email: registration.email.trim(), phone: registration.phone.trim() },
      {
        onSuccess: () => setRegistrationSubmitted(true),
        onError: (error) => {
          // Already registered (409) is still a success from the member's point of view.
          if (error instanceof ApiError && error.code === 'CONFLICT') setRegistrationSubmitted(true);
          else setRegistrationError(errorMessage(error));
        },
      },
    );
  };

  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
      <ScrollView contentContainerStyle={styles.content}>
        {back}
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
            {registrationError ? <Text style={styles.registrationError}>{registrationError}</Text> : null}
            <Button label={register.isPending ? 'Registering…' : 'Register now'} onPress={handleRegister} disabled={register.isPending || !registration.name.trim() || !registration.email.trim() || !registration.phone.trim()} />
          </View>
        )}

        <Text style={[styles.section, isDark && styles.darkText]}>Hosted by {event.organiser}</Text>
        <Text style={[styles.copy, isDark && styles.darkSecondaryText]}>{event.attendees.toLocaleString()} people are attending.</Text>

        <ReviewSection
          reviews={event.reviews}
          rating={event.rating}
          reviewCount={event.reviewCount}
          onSubmit={async (review) => { await createReview.mutateAsync(review); }}
        />

        <View style={{ height: 20 }} />
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
  registrationError: { color: colors.danger, fontSize: 13 },
  registrationSuccess: { color: colors.primary, fontSize: 14, lineHeight: 21, fontWeight: '600', marginTop: 4 },
});
