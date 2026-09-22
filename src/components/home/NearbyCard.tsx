import { memo } from 'react';
import { Pressable, Text, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import GlassCard from '@/components/ui/GlassCard';
import { colors, darkColors } from '@/constants/colors';
import { radius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import type { Place } from '@/types';
import { useTheme } from '@/context/ThemeProvider';

interface NearbyCardProps {
  place: Place;
  saved?: boolean;
  onPress: () => void;
  onToggleSave: () => void;
  style?: StyleProp<ViewStyle>;
}

function NearbyCard({ place, saved, onPress, onToggleSave, style }: NearbyCardProps) {
  const { isDark } = useTheme();
  return (
    <GlassCard level="standard" gradientBorder="subtle" style={[styles.card, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${place.name}`}
        onPress={onPress}
        style={styles.pressable}
      >
      <View>
        <Image source={{ uri: place.imageUrl }} style={styles.image} contentFit="cover" />
        <Pressable
          accessibilityLabel={saved ? 'Remove saved place' : 'Save place'}
          onPress={onToggleSave}
          style={[styles.heart, isDark && styles.heartDark]}
        >
          <Text>{saved ? '♥' : '♡'}</Text>
        </Pressable>
        <Text style={[styles.category, isDark && styles.categoryDark]}>✦ {place.category}</Text>
      </View>
      <View style={styles.body}>
        <Text numberOfLines={1} style={[styles.name, isDark && styles.darkText]}>{place.name}</Text>
        <Text numberOfLines={1} style={[styles.meta, isDark && styles.darkSecondaryText]}>★ {place.rating}  ({place.reviewCount})  ·  {place.distance}</Text>
        <Text numberOfLines={1} style={styles.badge}>✓ {place.verifications[0].replace('_', ' ')}</Text>
      </View>
      </Pressable>
    </GlassCard>
  );
}

export default memo(NearbyCard);

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: 0,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  pressable: { flex: 1, overflow: 'hidden' },
  darkText: { color: darkColors.textPrimary },
  darkSecondaryText: { color: darkColors.textSecondary },
  image: { width: '100%', height: 112 },
  heart: {
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.86)',
  },
  heartDark: { backgroundColor: darkColors.softSurface },
  category: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    color: colors.textPrimary,
    backgroundColor: 'rgba(255,255,255,0.86)',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radius.xs,
    fontSize: typography.caption.fontSize,
    textTransform: 'capitalize',
  },
  categoryDark: { color: darkColors.textPrimary, backgroundColor: darkColors.softSurface },
  body: { padding: spacing.sm },
  name: { color: colors.textPrimary, fontSize: typography.cardTitle.fontSize, lineHeight: typography.cardTitle.lineHeight, fontWeight: typography.cardTitle.fontWeight },
  meta: { color: colors.warning, fontSize: typography.caption.fontSize, marginTop: spacing.xxs },
  badge: { color: colors.primary, fontSize: typography.caption.fontSize, fontWeight: typography.caption.fontWeight, marginTop: spacing.xs, textTransform: 'capitalize' },
});
