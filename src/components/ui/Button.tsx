import { Pressable, Text, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { glass } from '@/constants/glass';
import { radius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeProvider';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'purple' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function Button({ label, onPress, variant = 'primary', disabled = false, style }: ButtonProps) {
  const { isDark } = useTheme();
  const buttonTheme = isDark ? glass.button.dark : glass.button.light;
  const content = <Text style={[styles.label, variant === 'danger' && styles.dangerLabel]}>{label}</Text>;
  const isPrimary = variant === 'primary' || variant === 'purple';
  const isSecondary = variant === 'secondary';
  const glassStyle = glass.buttonsEnabled && (isPrimary || isSecondary)
    ? {
        backgroundColor: isPrimary ? buttonTheme.primary : buttonTheme.secondary,
        borderColor: buttonTheme.border,
        shadowColor: buttonTheme.shadow,
      }
    : undefined;

  if (isPrimary) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={[styles.button, styles.primaryButton, style, disabled && styles.disabled]}>
        {glass.buttonsEnabled ? (
          <View style={[styles.solidButton, glassStyle]}>{content}</View>
        ) : (
          <LinearGradient
            colors={variant === 'purple' ? ['#732982', '#732982'] : (isDark ? ['#F43F5E', '#EC4899'] : [colors.primary, colors.gradientEnd])}
            style={styles.gradient}
          >
            {content}
          </LinearGradient>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        style,
        variant === 'danger' ? styles.danger : variant === 'success' ? styles.success : (isDark ? styles.secondaryDark : styles.secondary),
        glassStyle,
        disabled && styles.disabled,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.button,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
  },
  primaryButton: { paddingHorizontal: 0 },
  gradient: {
    alignSelf: 'stretch',
    flex: 1,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.button,
  },
  solidButton: {
    alignSelf: 'stretch',
    flex: 1,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  label: {
    color: '#fff',
    fontFamily: 'Inter_400Regular',
    fontSize: typography.button.fontSize,
    lineHeight: typography.button.lineHeight,
    fontWeight: typography.button.fontWeight,
  },
  dangerLabel: { color: '#fff' },
  secondary: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  secondaryDark: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  danger: {
    backgroundColor: '#DC2626',
    borderWidth: 1,
    borderColor: '#F87171',
  },
  success: {
    backgroundColor: '#00C853',
    borderWidth: 1,
    borderColor: '#00A844',
  },
  disabled: { opacity: 0.45 },
});
