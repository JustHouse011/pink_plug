import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeProvider';
interface IconButtonProps { label: string; icon: string; onPress: () => void; }
export default function IconButton({ label, icon, onPress }: IconButtonProps) { const { isDark } = useTheme(); return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.button, isDark && styles.buttonDark]}><Text style={styles.icon}>{icon}</Text></Pressable>; }
const styles = StyleSheet.create({ button: { width: 44, height: 44, borderRadius: 30, backgroundColor: 'rgba(244,241,255,0.88)', alignItems: 'center', justifyContent: 'center' }, buttonDark: { backgroundColor: '#231A3D', borderWidth: 1, borderColor: '#3B2B55' }, icon: { fontFamily: 'Inter_400Regular', fontSize: 19 } });
