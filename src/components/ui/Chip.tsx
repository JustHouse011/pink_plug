import { Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeProvider';
interface ChipProps { label: string; active?: boolean; onPress?: () => void; }
export default function Chip({ label, active = false, onPress }: ChipProps) {
	const { isDark } = useTheme();
	return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.chip, isDark && styles.chipDark, active && (isDark ? styles.activeDark : styles.active)]}><Text style={[styles.label, isDark && styles.labelDark, active && styles.activeLabel]}>{label}</Text></Pressable>;
}
const styles = StyleSheet.create({ chip: { minHeight: 40, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', flexShrink: 1 }, chipDark: { backgroundColor: '#161224', borderColor: '#334155' }, active: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }, activeDark: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' }, label: { color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontSize: 12 }, labelDark: { color: '#CBD5E1' }, activeLabel: { color: '#fff' } });
