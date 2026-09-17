import { Tabs } from 'expo-router';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/context/ThemeProvider';

const items = [
  { name: 'home', label: 'Home', icon: 'home-outline' as const },
  { name: 'explore', label: 'Explore', icon: 'compass-outline' as const },
  { name: 'community', label: 'Community', icon: 'people-outline' as const },
  { name: 'route', label: 'Route', icon: 'map-outline' as const },
];

export default function TabLayout() {
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigationBottom = Math.max(insets.bottom + 10, 24);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        sceneStyle: {
          paddingBottom: 110 + insets.bottom,
          backgroundColor: isDark ? '#0A0712' : colors.background,
        },
        tabBarStyle: [styles.bar, { bottom: navigationBottom }, isDark && styles.barDark],
        tabBarButton: (props: any) => <Pressable {...props} style={styles.item} />,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <NavIcon item={items[0]} focused={focused} isDark={isDark} onPress={() => setActiveTab('home')} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => (
            <NavIcon item={items[1]} focused={focused} isDark={isDark} onPress={() => setActiveTab('explore')} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          tabBarIcon: ({ focused }) => (
            <NavIcon item={items[2]} focused={focused} isDark={isDark} onPress={() => setActiveTab('community')} />
          ),
        }}
      />
      <Tabs.Screen
        name="route"
        options={{
          tabBarIcon: ({ focused }) => (
            <NavIcon item={items[3]} focused={focused} isDark={isDark} onPress={() => setActiveTab('route')} />
          ),
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

function NavIcon({ item, focused, isDark }: { item: (typeof items)[number]; focused: boolean; isDark: boolean; onPress: () => void }) {
  return (
    <View style={styles.icon}>
      <View style={[styles.iconCircle, focused && (isDark ? styles.activeDark : styles.active)]}>
        <Ionicons name={item.icon} size={21} color={colors.primary} />
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        style={[styles.label, focused && styles.activeText]}
      >
        {item.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 18,
    right: 18,
    height: 88,
    borderRadius: 26,
    borderTopWidth: 0,
    borderColor: 'rgba(122, 92, 244, 0.08)',
    backgroundColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#1F1230',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    paddingTop: 10,
    paddingBottom: 16,
  },
  barDark: {
    backgroundColor: '#161224',
    borderWidth: 1,
    borderTopWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.8)',
    shadowColor: '#000',
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
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: {
    backgroundColor: '#FDE8FA',
    shadowColor: '#E63CD8',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  activeDark: {
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  label: {
    color: '#E63CD8',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.15,
    marginTop: 3,
    width: 80,
    textAlign: 'center',
    includeFontPadding: false,
  },
  activeText: { color: '#E63CD8' },
});

