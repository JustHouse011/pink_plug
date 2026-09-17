import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeProvider';
interface SectionHeaderProps { title: string; action?: string; onAction?: () => void; }
export default function SectionHeader({ title, action, onAction }: SectionHeaderProps) { const { isDark } = useTheme(); return <View style={styles.row}><Text accessibilityRole="header" style={[styles.title, isDark && styles.titleDark]}>{title}</Text>{action && <Pressable accessibilityRole="button" accessibilityLabel={action} onPress={onAction}><Text style={styles.action}>{action}  ›</Text></Pressable>}</View>; }
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, title: { color: colors.textPrimary, fontSize: 17, fontWeight: '600' }, titleDark: { color: '#F8FAFC' }, action: { color: colors.primary, fontSize: 12, fontWeight: '600' } });
