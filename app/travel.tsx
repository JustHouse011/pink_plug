import { SafeAreaView, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeProvider';

const routes = [
  { id: 'r1', title: 'Cape Town loop', subtitle: 'Long Street → De Waterkant → Green Point', time: '18 min' },
  { id: 'r2', title: 'Johannesburg nightlife', subtitle: 'Braamfontein → Jeppestown → Maboneng', time: '24 min' },
  { id: 'r3', title: 'Durban safe walk', subtitle: 'Florida Road → Morningside → beach route', time: '16 min' },
];

export default function Travel() {
  const router = useRouter();
  const { isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.back} onPress={() => router.back()}>{'‹'} Travel</Text>
        <Text accessibilityRole="header" style={[styles.title, isDark && styles.darkText]}>Travel & safety</Text>
        <Text style={[styles.subtitle, isDark && styles.darkSecondaryText]}>Plan queer-friendly routes before you head out.</Text>

        <LinearGradient colors={['#7C3AED', '#D62BD9']} style={styles.hero}>
          <Text style={styles.heroIcon}>✦</Text>
          <Text style={styles.heroTitle}>Pink Route</Text>
          <Text style={styles.heroCopy}>Private, trusted route planning for your next night out.</Text>
        </LinearGradient>

        <Text style={[styles.section, isDark && styles.darkText]}>Suggested trips</Text>
        <View style={styles.list}>
          {routes.map((route) => (
            <Card key={route.id} style={styles.routeCard}>
              <Text style={[styles.routeTitle, isDark && styles.darkText]}>{route.title}</Text>
              <Text style={[styles.routeSubtitle, isDark && styles.darkSecondaryText]}>{route.subtitle}</Text>
              <Text style={styles.routeTime}>{route.time}</Text>
            </Card>
          ))}
        </View>

        <Text style={[styles.section, isDark && styles.darkText]}>Travel tips</Text>
        <Card style={styles.tipCard}>
          <Text style={[styles.tipText, isDark && styles.darkSecondaryText]}>• Share your route with a trusted contact.</Text>
          <Text style={[styles.tipText, isDark && styles.darkSecondaryText]}>• Stick to well-lit, busy routes after dark.</Text>
          <Text style={[styles.tipText, isDark && styles.darkSecondaryText]}>• Use safety scores and community checks when choosing stops.</Text>
        </Card>

        <Button label="Build my route" onPress={() => router.push('/(tabs)/route')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  safeDark: { backgroundColor: '#0A0712' }, darkText: { color: '#F8FAFC' }, darkSecondaryText: { color: '#C4B5D9' },
  content: { padding: 20, paddingBottom: 120 },
  back: { color: colors.primary, fontSize: 18, fontWeight: '600', marginBottom: 8 },
  title: { color: colors.textPrimary, fontSize: 29, fontWeight: '600' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 4, marginBottom: 18 },
  hero: { borderRadius: 24, padding: 22, minHeight: 170, justifyContent: 'center', marginBottom: 18 },
  heroIcon: { color: '#fff', fontSize: 42 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '600', marginTop: 8 },
  heroCopy: { color: '#F1E5FF', fontSize: 13, marginTop: 4, lineHeight: 20 },
  section: { color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 10 },
  list: { gap: 10, marginBottom: 18 },
  routeCard: { padding: 14 },
  routeTitle: { color: colors.textPrimary, fontWeight: '600', marginBottom: 4 },
  routeSubtitle: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  routeTime: { marginTop: 8, color: colors.primary, fontWeight: '600', fontSize: 12 },
  tipCard: { padding: 14, marginBottom: 18 },
  tipText: { color: colors.textSecondary, fontSize: 13, lineHeight: 22 },
});

