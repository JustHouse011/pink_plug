import { View, StyleSheet, type ViewProps } from 'react-native';
import { colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeProvider';
export default function Card({ children, style, ...props }: ViewProps) {
	const { isDark } = useTheme();
	return <View style={[styles.card, isDark && styles.cardDark, style]} {...props}>{children}</View>;
}
const styles = StyleSheet.create({ card: { backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 16, shadowColor: colors.primary, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 }, cardDark: { backgroundColor: '#161224', borderColor: '#334155' } });
