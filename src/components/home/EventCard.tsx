import { Pressable, Text, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/constants/colors';
import type { Event } from '@/types';
import { useTheme } from '@/context/ThemeProvider';

interface EventCardProps {
  event: Event;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function EventCard({ event, onPress, style }: EventCardProps) {
  const { isDark } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${event.title}`}
      onPress={onPress}
      style={[styles.card, isDark && styles.cardDark, style]}
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
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    flexDirection: 'row',
    minHeight: 88,
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardDark: { borderColor: '#334155', backgroundColor: '#161224' },
  darkText: { color: '#F8FAFC' },
  darkSecondaryText: { color: '#C4B5D9' },
  image: { width: 88, height: 88 },
  content: { flex: 1, padding: 12, justifyContent: 'center' },
  title: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  meta: { color: colors.textSecondary, fontSize: 11, marginTop: 5 },
  price: { color: colors.warning, fontSize: 12, fontWeight: '600', marginTop: 5 },
  free: { color: colors.success },
});
