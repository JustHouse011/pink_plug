import { Pressable, Text, StyleSheet } from 'react-native';
import { glass } from '@/constants/glass';
import { useTheme } from '@/context/ThemeProvider';
interface IconButtonProps { label: string; icon: string; onPress: () => void; }
export default function IconButton({ label, icon, onPress }: IconButtonProps) { const { isDark } = useTheme(); return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.button, isDark && styles.buttonDark]}><Text style={styles.icon}>{icon}</Text></Pressable>; }
const styles = StyleSheet.create({ button: { width: 44, height: 44, borderRadius: 30, backgroundColor: glass.light.subtle.background, borderWidth: 1, borderColor: glass.light.subtle.border, alignItems: 'center', justifyContent: 'center' }, buttonDark: { backgroundColor: glass.dark.subtle.background, borderColor: glass.dark.subtle.border }, icon: { fontFamily: 'Inter_400Regular', fontSize: 19 } });
