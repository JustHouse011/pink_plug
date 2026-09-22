import { Text, StyleSheet } from 'react-native';
import { colors, darkColors } from '@/constants/colors';
import { radius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeProvider';

interface BadgeProps { label: string; tone?: 'purple' | 'cyan' | 'green' | 'amber' | 'danger'; }

export default function Badge({ label, tone = 'purple' }: BadgeProps) {
  const { isDark } = useTheme();
  return <Text style={[styles.badge, styles[tone], isDark && styles[`${tone}Dark` as keyof typeof styles]]}>{label}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    fontFamily: 'Inter_400Regular',
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    fontWeight: typography.caption.fontWeight,
    overflow: 'hidden',
  },
  purple: { color: colors.primary, backgroundColor: '#EEE7FF' },
  purpleDark: { color: colors.primaryBright, backgroundColor: 'rgba(168, 85, 247, 0.18)' },
  cyan: { color: '#087F8C', backgroundColor: '#DDF8F6' },
  cyanDark: { color: '#7DE3E8', backgroundColor: 'rgba(34, 211, 238, 0.14)' },
  green: { color: '#087F55', backgroundColor: '#DDF8ED' },
  greenDark: { color: '#7BE0B4', backgroundColor: 'rgba(0, 196, 140, 0.14)' },
  amber: { color: '#A35A00', backgroundColor: '#FFF1D6' },
  amberDark: { color: '#FFD17A', backgroundColor: 'rgba(245, 158, 11, 0.16)' },
  danger: { color: colors.danger, backgroundColor: '#FDE8E8' },
  dangerDark: { color: '#FF9B9B', backgroundColor: 'rgba(239, 68, 68, 0.16)' },
});
