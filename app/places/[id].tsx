import { Linking, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ReviewSection from '@/components/reviews/ReviewSection';
import { colors, darkColors } from '@/constants/colors';
import LoadState from '@/components/ui/LoadState';
import { useAppStore } from '@/store/useAppStore';
import { useCreateReview, usePlace, useSavedPlaces, useToggleSavedPlace } from '@/hooks/useApi';
import { useTheme } from '@/context/ThemeProvider';

const renderStars = (rating: number) => {
  const fullStars = Math.round(rating);
  return '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
};

export default function PlaceDetail() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const placeQuery = usePlace(id);
  const createReview = useCreateReview('place', id ?? '');
  const savedPlaces = useSavedPlaces();
  const toggleSaved = useToggleSavedPlace();
  const add = useAppStore((state) => state.addWaypoint);
  const place = placeQuery.data;

  const back = (
    <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
      <Text style={styles.back}>‹  Back</Text>
    </Pressable>
  );

  if (!place) {
    return (
      <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
        <View style={styles.content}>
          {back}
          <LoadState loading={placeQuery.isPending} error={placeQuery.error} onRetry={() => placeQuery.refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  const reviewList = place.reviews;
  const isSaved = savedPlaces.data?.some((item) => item.id === place.id) ?? false;

  const handleSubmitReview = async ({ rating, headline, comment }: { rating: number; headline: string; comment: string }) => {
    await createReview.mutateAsync({ rating, headline, comment });
  };

  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
      <ScrollView contentContainerStyle={styles.content}>
        {back}
        <Image source={{ uri: place.imageUrl }} style={styles.hero} contentFit="cover" />
        <Text style={[styles.title, isDark && styles.darkText]}>{place.name}</Text>
        <Text style={[styles.meta, isDark && styles.darkSecondaryText]}>📍 {place.address}</Text>
        <View style={styles.row}>
          <Text style={styles.rating}>{renderStars(place.rating)} {place.rating.toFixed(1)}</Text>
          <Text style={[styles.meta, isDark && styles.darkSecondaryText]}>({place.reviewCount} reviews){place.distance ? ` · ${place.distance}` : ''}</Text>
        </View>

        <View style={styles.badges}>
          {place.verifications.map((item) => <Badge key={item} label={item.replace('_', ' ')} />)}
        </View>

        <View style={styles.score}>
          <Text style={styles.scoreIcon}>🛡️</Text>
          <View style={styles.scoreText}>
            <Text style={styles.scoreTitle}>Community safety score</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${place.safetyScore}%` }]} />
            </View>
          </View>
          <Text style={styles.scoreValue}>{place.safetyScore}%</Text>
        </View>

        <Text style={[styles.section, isDark && styles.darkText]}>About</Text>
        <Text style={[styles.copy, isDark && styles.darkSecondaryText]}>{place.description}</Text>
        <Text style={[styles.section, isDark && styles.darkText]}>Opening hours</Text>
        <Text style={[styles.copy, isDark && styles.darkSecondaryText]}>{place.hours}</Text>

        <ReviewSection reviews={reviewList} rating={place.rating} reviewCount={place.reviewCount} onSubmit={handleSubmitReview} />

        <View style={styles.actions}>
          <Button label="Add to Pink Route" onPress={() => add(place)} />
          <Button
            label={isSaved ? 'Saved ♥' : 'Save place'}
            variant="secondary"
            onPress={() => toggleSaved.mutate({ place, saved: !isSaved })}
          />
          <Button
            label="Directions"
            variant="secondary"
            onPress={() => Linking.openURL(`https://maps.google.com/?q=${place.coords.latitude},${place.coords.longitude}`)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  safeDark: { backgroundColor: 'transparent' }, darkText: { color: darkColors.textPrimary }, darkSecondaryText: { color: darkColors.textSecondary },
  content: { padding: 20, paddingBottom: 60 },
  back: { color: colors.primary, fontSize: 18, fontWeight: '600', marginBottom: 12 },
  hero: { width: '100%', height: 230, borderRadius: 24 },
  title: { color: colors.textPrimary, fontSize: 27, fontWeight: '600', marginTop: 16 },
  meta: { color: colors.textSecondary, fontSize: 13, marginTop: 5 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' },
  rating: { color: colors.warning, fontWeight: '600' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 16 },
  score: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 18, backgroundColor: '#DDF8F6' },
  scoreIcon: { fontSize: 25 },
  scoreText: { flex: 1 },
  scoreTitle: { color: colors.textPrimary, fontWeight: '600', fontSize: 12 },
  track: { height: 5, backgroundColor: '#B5E8E4', borderRadius: 5, marginTop: 7 },
  fill: { height: 5, backgroundColor: colors.success, borderRadius: 5 },
  scoreValue: { color: '#087F55', fontWeight: '600' },
  section: { color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginTop: 22, marginBottom: 7 },
  copy: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
  actions: { gap: 10, marginTop: 28 },
});
