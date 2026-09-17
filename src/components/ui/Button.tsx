import { Pressable, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeProvider';

interface ButtonProps { label: string; onPress: () => void; variant?: 'primary' | 'purple' | 'secondary' | 'danger'; disabled?: boolean; style?: StyleProp<ViewStyle>; }
export default function Button({ label, onPress, variant = 'primary', disabled = false, style }: ButtonProps) {
  const { isDark } = useTheme();
  const content = <Text style={[styles.label, variant !== 'primary' && variant !== 'purple' && styles.darkLabel]}>{label}</Text>;
  return variant === 'primary' || variant === 'purple' ? <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={[styles.button, styles.primaryButton, style, disabled && styles.disabled]}><LinearGradient colors={variant === 'purple' ? ['#732982', '#732982'] : (isDark ? ['#F43F5E', '#EC4899'] : [colors.primary, colors.gradientEnd])} style={styles.gradient}>{content}</LinearGradient></Pressable> : <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={[styles.button, style, variant === 'danger' ? styles.danger : (isDark ? styles.secondaryDark : styles.secondary), disabled && styles.disabled]}>{content}</Pressable>;
}
const styles = StyleSheet.create({ button: { minHeight: 48, paddingHorizontal: 18, borderRadius: 30, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', flexShrink: 1 }, primaryButton: { paddingHorizontal: 0 }, gradient: { alignSelf: 'stretch', flex: 1, minHeight: 48, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 30 }, label: { color: '#fff', fontFamily: 'Inter_400Regular', fontSize: 14 }, darkLabel: { color: '#F8FAFC' }, secondary: { backgroundColor: colors.softLavender, borderWidth: 1, borderColor: colors.border }, secondaryDark: { backgroundColor: '#231A3D', borderWidth: 1, borderColor: '#334155' }, danger: { backgroundColor: '#DC2626', borderWidth: 1, borderColor: '#F87171' }, disabled: { opacity: 0.45 } });
