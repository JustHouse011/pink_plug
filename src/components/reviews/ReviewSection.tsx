import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, darkColors } from '@/constants/colors';
import GlassCard from '@/components/ui/GlassCard';
import { useTheme } from '@/context/ThemeProvider';
import type { Review } from '@/types';

interface ReviewSectionProps {
  reviews: Review[];
  onSubmit: (review: { rating: number; headline: string; comment: string }) => void;
}

const renderStars = (rating: number) => {
  const fullStars = Math.round(rating);
  return '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
};

export default function ReviewSection({ reviews, onSubmit }: ReviewSectionProps) {
  const { isDark } = useTheme();
  const [userRating, setUserRating] = useState(5);
  const [headline, setHeadline] = useState('');
  const [comment, setComment] = useState('');

  const summary = useMemo(() => {
    const count = reviews.length || 1;
    const average = reviews.reduce((total, review) => total + review.rating, 0) / count;
    return { average, count };
  }, [reviews]);

  const handleSubmit = () => {
    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      return;
    }

    onSubmit({
      rating: userRating,
      headline: headline.trim() || 'My experience',
      comment: trimmedComment,
    });

    setHeadline('');
    setComment('');
    setUserRating(5);
  };

  return (
    <View>
      <Text style={[styles.section, isDark && styles.darkPrimary]}>Reviews</Text>
      <GlassCard level="hero" edge="glow" style={styles.reviewSummary}>
        <Text style={[styles.reviewSummaryValue, isDark && styles.darkPrimary]}>{summary.average.toFixed(1)}</Text>
        <View style={styles.reviewSummaryMeta}>
          <Text style={styles.reviewSummaryStars}>{renderStars(summary.average)}</Text>
          <Text style={[styles.reviewSummaryText, isDark && styles.darkSecondary]}>{summary.count} community reviews</Text>
        </View>
      </GlassCard>

      {reviews.map((review) => (
        <GlassCard key={review.id} level="standard" edge="subtle" style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Text style={styles.avatar}>{review.avatar}</Text>
            <View style={styles.reviewHeaderText}>
              <Text style={[styles.reviewUser, isDark && styles.darkPrimary]}>{review.user}</Text>
              <Text style={[styles.reviewMeta, isDark && styles.darkSecondary]}>{review.timeAgo}</Text>
            </View>
            <Text style={styles.reviewRating}>{renderStars(review.rating)}</Text>
          </View>
          <Text style={[styles.reviewHeadline, isDark && styles.darkPrimary]}>{review.headline}</Text>
          <Text style={[styles.reviewComment, isDark && styles.darkSecondary]}>{review.comment}</Text>
        </GlassCard>
      ))}

      <GlassCard level="hero" edge="glow" style={styles.reviewForm}>
        <Text style={[styles.formTitle, isDark && styles.darkPrimary]}>Write a review</Text>
        <View style={styles.starSelector}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Pressable
              key={value}
              onPress={() => setUserRating(value)}
              style={[styles.starButton, value <= userRating && styles.starButtonActive]}
            >
              <Text style={[styles.starText, value <= userRating && styles.starTextActive]}>
                {value <= userRating ? '★' : '☆'}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={headline}
          onChangeText={setHeadline}
          placeholder="Headline (optional)"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, isDark && styles.inputDark]}
        />

        <TextInput
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
          placeholder="Share your experience..."
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, styles.textArea, isDark && styles.inputDark]}
        />

        <Pressable onPress={handleSubmit} style={styles.submitButton}>
          <Text style={styles.submitLabel}>Submit review</Text>
        </Pressable>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginTop: 24, marginBottom: 7 },
  reviewSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
  },
  reviewSummaryValue: { color: colors.textPrimary, fontSize: 24, fontWeight: '600' },
  reviewSummaryMeta: { flex: 1 },
  reviewSummaryStars: { color: colors.warning, fontSize: 14, letterSpacing: 1.5 },
  reviewSummaryText: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  reviewCard: {
    padding: 14,
    marginTop: 12,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { fontSize: 20 },
  reviewHeaderText: { flex: 1 },
  reviewUser: { color: colors.textPrimary, fontWeight: '600', fontSize: 13 },
  reviewMeta: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  reviewRating: { color: colors.warning, fontSize: 12, letterSpacing: 1 },
  reviewHeadline: { color: colors.textPrimary, fontWeight: '600', fontSize: 13, marginTop: 10 },
  reviewComment: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 6 },
  reviewForm: {
    marginTop: 24,
    padding: 16,
    borderRadius: 22,
    gap: 12,
  },
  formTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  starSelector: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  starButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
  },
  starButtonActive: { backgroundColor: '#FFE5A3' },
  starText: { fontSize: 22, color: colors.textSecondary },
  starTextActive: { color: '#E7A300' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.textPrimary,
    backgroundColor: 'rgba(255, 255, 255, 0.30)',
    fontSize: 14,
  },
  inputDark: { backgroundColor: darkColors.input, borderColor: darkColors.border, color: darkColors.textPrimary },
  darkPrimary: { color: darkColors.textPrimary },
  darkSecondary: { color: darkColors.textSecondary },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  submitButton: {
    minHeight: 48,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  submitLabel: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
