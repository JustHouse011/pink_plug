import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, darkColors } from '@/constants/colors';
import { radius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import GlassCard from './GlassCard';
import { useTheme } from '@/context/ThemeProvider';

interface NotificationBarProps {
  title: string;
  subtitle: string;
  ctaLabel: string;
  onPress: () => void;
}

export default function NotificationBar({
  title,
  subtitle,
  ctaLabel,
  onPress,
}: NotificationBarProps) {
  const { isDark } = useTheme();
  return (
    <GlassCard level="hero" edge="glow" style={styles.wrapper}>
      <View style={styles.iconWrap}>
        <Ionicons name="notifications-outline" size={18} color={isDark ? colors.primary : '#fff'} />
      </View>

      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: isDark ? darkColors.textPrimary : colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: isDark ? darkColors.textSecondary : colors.textSecondary }]}>{subtitle}</Text>
      </View>

      <Pressable
        onPress={onPress}
        style={styles.button}
      >
        <Text style={styles.buttonText}>{ctaLabel}</Text>
      </Pressable>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.cardTitle.fontSize,
    lineHeight: typography.cardTitle.lineHeight,
    fontWeight: typography.cardTitle.fontWeight,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    marginTop: 3,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  buttonText: {
    color: '#fff',
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    fontWeight: typography.caption.fontWeight,
  },
});
