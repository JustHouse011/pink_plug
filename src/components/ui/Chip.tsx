import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, darkColors } from '@/constants/colors';
import { radius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeProvider';

interface ChipProps { label: string; active?: boolean; onPress?: () => void; }

export default function Chip({ label, active = false, onPress }: ChipProps) {
  const { isDark } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.chip, isDark && styles.chipDark, active && (isDark ? styles.activeDark : styles.active)]}
    >
      <Text style={[styles.label, isDark && styles.labelDark, active && styles.activeLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
  },
  chipDark: { backgroundColor: darkColors.input, borderColor: darkColors.border },
  active: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
  activeDark: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
  label: {
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    fontWeight: typography.caption.fontWeight,
  },
  labelDark: { color: darkColors.textSecondary },
  activeLabel: { color: '#fff' },
});
