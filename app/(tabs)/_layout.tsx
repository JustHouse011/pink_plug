import { Tabs } from 'expo-router';
import { Platform, Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FLOATING_TAB_HEIGHT, getTabLayout } from '@/layout/tabLayout';
import { colors, darkColors } from '@/constants/colors';
import { glass } from '@/constants/glass';
import { radius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import { useTheme } from '@/context/ThemeProvider';

const items = [
  { name: 'home', label: 'Home', icon: 'home-outline' as const },
  { name: 'explore', label: 'Explore', icon: 'compass-outline' as const },
  { name: 'community', label: 'Community', icon: 'people-outline' as const },
  { name: 'route', label: 'Route', icon: 'map-outline' as const },
];

export default function TabLayout() {
  // The native stack's content frame may differ from the full-window frame.
  // Measure remaining safe area here instead of inheriting already-consumed insets.
  return Platform.OS === 'ios'
    ? <SafeAreaProvider><TabNavigator /></SafeAreaProvider>
    : <TabNavigator />;
}

function TabNavigator() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { barBottom, contentBottomPadding } = getTabLayout(insets.bottom, Platform.OS);

  return (
    <Tabs
      initialRouteName="home"
      // barBottom owns the system inset; the bar's internal padding is decorative.
      safeAreaInsets={Platform.OS === 'ios' ? { bottom: 0 } : undefined}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.label,
        sceneStyle: {
          paddingBottom: Platform.OS === 'ios' ? 0 : 24 + insets.bottom,
          backgroundColor: 'transparent',
        },
        tabBarStyle: [styles.bar, { bottom: barBottom }, isDark && styles.barDark],
        tabBarBackground: () => (
          <LinearGradient
            pointerEvents="none"
            colors={isDark ? glass.gradientBorder.emphasized : glass.gradientBorder.lightEmphasized}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.barGradient}
          >
            <BlurView
              intensity={isDark ? glass.dark.hero.blurIntensity : glass.light.standard.blurIntensity}
              tint={isDark ? 'dark' : 'light'}
              style={[styles.barBackground, { backgroundColor: isDark ? glass.dark.hero.background : glass.light.hero.background }]}
            />
          </LinearGradient>
        ),
        tabBarButton: (props: any) => <Pressable {...props} style={Platform.OS === 'ios' ? [props.style, styles.item] : styles.item} />,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: items[0].label,
          tabBarIcon: () => <NavIcon item={items[0]} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarLabel: items[1].label,
          tabBarIcon: () => <NavIcon item={items[1]} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          tabBarLabel: items[2].label,
          tabBarIcon: () => <NavIcon item={items[2]} />,
        }}
      />
      <Tabs.Screen
        name="route"
        options={{
          tabBarLabel: items[3].label,
          // The map does not scroll: reserve its controls' clearance in the scene.
          ...(Platform.OS === 'ios' && { sceneStyle: { paddingBottom: contentBottomPadding, backgroundColor: 'transparent' } }),
          tabBarIcon: () => <NavIcon item={items[3]} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

function NavIcon({ item }: { item: (typeof items)[number] }) {
  return (
    <View style={styles.icon}>
      <View style={styles.iconCircle}>
        <Ionicons name={item.icon} size={24} color={colors.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    height: FLOATING_TAB_HEIGHT,
    borderRadius: radius.xl,
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    paddingTop: 8,
    paddingBottom: 12,
  },
  barDark: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderTopWidth: 0,
  },
  barBackground: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  barGradient: {
    flex: 1,
    borderRadius: radius.xl,
    padding: 1.5,
    overflow: 'hidden',
  },
  item: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  icon: {
    width: 80,
    maxWidth: '100%',
    minWidth: 0,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#E63CD8',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.15,
    marginTop: 0,
    includeFontPadding: false,
  },
});

