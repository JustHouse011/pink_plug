import { Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
interface BadgeProps { label: string; tone?: 'purple' | 'cyan' | 'green' | 'amber' | 'danger'; }
export default function Badge({ label, tone = 'purple' }: BadgeProps) { return <Text style={[styles.badge, styles[tone]]}>{label}</Text>; }
const styles = StyleSheet.create({ badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, fontFamily: 'Inter_400Regular', fontSize: 10, overflow: 'hidden' }, purple: { color: colors.primary, backgroundColor: '#EEE7FF' }, cyan: { color: '#087F8C', backgroundColor: '#DDF8F6' }, green: { color: '#087F55', backgroundColor: '#DDF8ED' }, amber: { color: '#A35A00', backgroundColor: '#FFF1D6' }, danger: { color: colors.danger, backgroundColor: '#FDE8E8' } });
