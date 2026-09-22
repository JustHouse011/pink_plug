import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeProvider';

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export default function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  const { isDark } = useTheme();

  return (
    <View style={styles.row}>
      <Text accessibilityRole="header" style={[styles.title, isDark && styles.titleDark]}>{title}</Text>
      {action && (
        <Pressable accessibilityRole="button" accessibilityLabel={action} onPress={onAction}>
          <Text style={styles.action}>{action}  ›</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sectionTitle.fontSize,
    lineHeight: typography.sectionTitle.lineHeight,
    fontWeight: typography.sectionTitle.fontWeight,
    letterSpacing: typography.sectionTitle.letterSpacing,
  },
  titleDark: { color: '#F8FAFC' },
  action: {
    color: colors.primary,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    fontWeight: typography.caption.fontWeight,
  },
});
