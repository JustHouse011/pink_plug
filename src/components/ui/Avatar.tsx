import { Image, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { colors } from '@/constants/colors';

interface AvatarProps {
  value?: string;
  size?: number;
  imageUri?: string | ImageSourcePropType | null;
}

export default function Avatar({ value = '•', size = 48, imageUri }: AvatarProps) {
  const displayValue = value || '•';
  const imageSource = typeof imageUri === 'string' ? { uri: imageUri } : imageUri;

  return (
    <View
      accessibilityLabel="Profile avatar"
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
    >
      {imageSource ? (
        <Image source={imageSource} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Text style={{ fontSize: size * 0.46 }}>{displayValue}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.softLavender,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
