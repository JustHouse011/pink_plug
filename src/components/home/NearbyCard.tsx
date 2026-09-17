import { Pressable, Text, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/constants/colors';
import type { Place } from '@/types';
import { useTheme } from '@/context/ThemeProvider';

interface NearbyCardProps {
  place: Place;
  saved?: boolean;
  onPress: () => void;
  onToggleSave: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function NearbyCard({ place, saved, onPress, onToggleSave, style }: NearbyCardProps) {
  const { isDark } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${place.name}`}
      onPress={onPress}
      style={[styles.card, isDark && styles.cardDark, style]}
    >
      <View>
        <Image source={{ uri: place.imageUrl }} style={styles.image} contentFit="cover" />
        <Pressable
          accessibilityLabel={saved ? 'Remove saved place' : 'Save place'}
          onPress={onToggleSave}
          style={styles.heart}
        >
          <Text>{saved ? '♥' : '♡'}</Text>
        </Pressable>
        <Text style={styles.category}>✦ {place.category}</Text>
      </View>
      <View style={styles.body}>
        <Text numberOfLines={1} style={[styles.name, isDark && styles.darkText]}>{place.name}</Text>
        <Text style={[styles.meta, isDark && styles.darkSecondaryText]}>★ {place.rating}  ({place.reviewCount})  ·  {place.distance}</Text>
        <Text style={styles.badge}>✓ {place.verifications[0].replace('_', ' ')}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 210,
    borderRadius: 22,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardDark: { borderColor: '#334155', backgroundColor: '#161224' },
  darkText: { color: '#F8FAFC' },
  darkSecondaryText: { color: '#C4B5D9' },
  image: { width: '100%', height: 112 },
  heart: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.86)',
  },
  category: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    color: colors.textPrimary,
    backgroundColor: 'rgba(255,255,255,0.86)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 10,
    textTransform: 'capitalize',
  },
  body: { padding: 12 },
  name: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  meta: { color: colors.warning, fontSize: 11, marginTop: 5 },
  badge: { color: colors.primary, fontSize: 10, fontWeight: '600', marginTop: 8, textTransform: 'capitalize' },
});
