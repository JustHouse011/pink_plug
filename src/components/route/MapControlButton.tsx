import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, darkColors } from '@/constants/colors';

type MapControlButtonProps = {
  label: string;
  onPress: () => void;
  isDark?: boolean;
  accent?: boolean;
};

export default function MapControlButton({ label, onPress, isDark = false, accent = false }: MapControlButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isDark && styles.buttonDark,
        accent && styles.accent,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, accent && styles.accentLabel, isDark && styles.labelDark]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    shadowColor: '#1B1122',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDark: {
    backgroundColor: 'rgba(24,20,35,0.72)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  accent: {
    backgroundColor: 'rgba(230,60,216,0.18)',
    borderColor: 'rgba(236,72,153,0.22)',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  label: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  accentLabel: {
    color: colors.primary,
  },
  labelDark: {
    color: darkColors.textPrimary,
  },
});
