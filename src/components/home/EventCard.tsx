import { memo } from 'react';
import { Pressable, Text, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import GlassCard from '@/components/ui/GlassCard';
import { colors, darkColors } from '@/constants/colors';
import { radius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import type { Event } from '@/types';
import { useTheme } from '@/context/ThemeProvider';

interface EventCardProps {
  event: Event;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

function EventCard({ event, onPress, style }: EventCardProps) {
  const { isDark } = useTheme();
  return (
    <GlassCard level="standard" gradientBorder="subtle" style={[styles.card, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${event.title}`}
        onPress={onPress}
        style={styles.pressable}
      >
      <Image
        source={typeof event.imageUrl === 'string' ? { uri: event.imageUrl } : event.imageUrl}
        style={styles.image}
        contentFit="cover"
      />
      <View style={styles.content}>
        <Text numberOfLines={1} style={[styles.title, isDark && styles.darkText]}>{event.title}</Text>
        <Text numberOfLines={1} style={[styles.meta, isDark && styles.darkSecondaryText]}>{event.date} · {event.venue}</Text>
        <Text style={[styles.price, event.price === 'Free' && styles.free]}>{event.price}</Text>
      </View>
      </Pressable>
    </GlassCard>
  );
}

export default memo(EventCard);

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: 0,
    flexDirection: 'row',
    minHeight: 88,
    overflow: 'hidden',
    borderRadius: radius.lg,
  },
  pressable: { flex: 1, flexDirection: 'row', minHeight: 88, overflow: 'hidden' },
  darkText: { color: darkColors.textPrimary },
  darkSecondaryText: { color: darkColors.textSecondary },
  image: { width: 88, height: 88 },
  content: { flex: 1, padding: spacing.sm, justifyContent: 'center' },
  title: { color: colors.textPrimary, fontSize: typography.cardTitle.fontSize, lineHeight: typography.cardTitle.lineHeight, fontWeight: typography.cardTitle.fontWeight },
  meta: { color: colors.textSecondary, fontSize: typography.caption.fontSize, marginTop: spacing.xxs },
  price: { color: colors.warning, fontSize: typography.bodySmall.fontSize, fontWeight: typography.bodySmall.fontWeight, marginTop: spacing.xxs },
  free: { color: colors.success },
});
