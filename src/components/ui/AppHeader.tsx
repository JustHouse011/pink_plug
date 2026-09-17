import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { MOCK_USER } from '@/data/mockData';
import Avatar from '@/components/ui/Avatar';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/context/ThemeProvider';

const hiddenRoutes = ['/', '/login', '/onboarding', '/register', '/index', '/profile-setup'];

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAppStore((state) => state.logout);
  const shareLocation = useAppStore((state) => state.shareLocation);
  const menuVisible = useAppStore((state) => state.headerMenuVisible);
  const setHeaderMenuVisible = useAppStore((state) => state.setHeaderMenuVisible);
  const setShowNotifications = useAppStore((state) => state.setShowNotifications);
  const { isDark, toggleTheme } = useTheme();

  if (hiddenRoutes.includes(pathname)) {
    return null;
  }

  const navigateTo = (path: string) => {
    setHeaderMenuVisible(false);
    setShowNotifications(false);

    setTimeout(() => {
      try {
        router.push(path as never);
      } catch {
        router.replace(path as never);
      }
    }, 0);
  };

  const menuItems = [
    {
      label: 'Edit Profile',
      icon: 'person-outline' as const,
      onPress: () => navigateTo('/settings'),
    },
    {
      label: 'Add Contacts',
      icon: 'people-outline' as const,
      onPress: () => navigateTo('/emergency-contacts'),
    },
    {
      label: 'Share location',
      icon: 'location-outline' as const,
      onPress: () => navigateTo('/(tabs)/route'),
    },
  ];

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.topBar}>
        <View style={styles.topBarActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            onPress={toggleTheme}
            style={[styles.themeButton, isDark && styles.themeButtonDark]}
          >
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={17} color={colors.primary} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => {
              if (pathname !== '/(tabs)/home') {
                router.push('/(tabs)/home' as never);
              }
              setShowNotifications(true);
            }}
            style={[styles.iconButton, isDark && styles.iconButtonDark]}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
            <View style={styles.notificationBadge}><Text style={styles.notificationBadgeText}>3</Text></View>
          </Pressable>

        </View>

        <View style={styles.avatarMenuWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile menu"
            onPress={() => setHeaderMenuVisible(!menuVisible)}
            style={styles.avatarButton}
          >
            <Avatar value={MOCK_USER.name.charAt(0)} imageUri={MOCK_USER.profileImageUrl} size={40} />
          </Pressable>
          <View
            accessibilityLabel={shareLocation ? 'Online' : 'Offline'}
            style={[styles.profileStatus, shareLocation ? styles.liveStatusActive : styles.liveStatusInactive]}
          />

          {menuVisible && (
            <View style={[styles.menuCard, isDark && styles.menuCardDark]}>
              <Pressable onPress={() => navigateTo('/(tabs)/profile')} style={styles.menuItem}>
                <Ionicons name="person-outline" size={16} color={isDark ? colors.primary : colors.textSecondary} />
                <Text style={[styles.menuItemText, isDark && styles.menuItemTextDark]}>View Profile</Text>
              </Pressable>

              {menuItems.map((item) => (
                <Pressable key={item.label} onPress={item.onPress} style={styles.menuItem}>
                  <Ionicons name={item.icon} size={16} color={isDark ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.menuItemText, isDark && styles.menuItemTextDark]}>{item.label}</Text>
                </Pressable>
              ))}

              <View style={styles.separator} />
              <Pressable
                onPress={() => {
                  setHeaderMenuVisible(false);
                  setShowNotifications(false);
                  logout();
                  router.replace('/login' as never);
                }}
                style={[styles.menuItem, styles.logoutItem]}
              >
                <Ionicons name="log-out-outline" size={16} color={isDark ? colors.primary : colors.danger} />
                <Text style={[styles.menuItemText, isDark && styles.menuItemTextDark, styles.logoutText]}>Logout</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(247, 243, 255, 0.95)',
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(113, 91, 188, 0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
    zIndex: 10,
  },
  containerDark: {
    backgroundColor: 'rgba(10, 7, 18, 0.95)',
    borderBottomColor: 'rgba(196, 181, 253, 0.14)',
  },
  dismissLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0E9FF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  themeButtonDark: {
    backgroundColor: '#231A3D',
    borderColor: '#3D2F63',
  },
  iconButton: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F3EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230, 60, 216, 0.12)',
  },
  iconButtonDark: { backgroundColor: '#231A3D', borderColor: '#3B2B55' },
  notificationBadge: {
    position: 'absolute',
    right: -3,
    top: -3,
    minWidth: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  profileStatus: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  liveStatusActive: {
    backgroundColor: '#22C55E',
  },
  liveStatusInactive: {
    backgroundColor: '#EF4444',
  },
  liveStatusDark: { borderWidth: 0 },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
  },
  liveTextActive: {
    color: '#047857',
  },
  liveTextInactive: {
    color: '#6D28D9',
  },
  avatarMenuWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(230, 60, 216, 0.12)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  menuCard: {
    position: 'absolute',
    right: 0,
    top: 54,
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F7D4F4',
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    zIndex: 100,
  },
  menuCardDark: {
    backgroundColor: '#161224',
    borderColor: '#3B2B55',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuItemText: {
    color: '#1F2B3A',
    fontSize: 14,
    fontWeight: '600',
  },
  menuItemTextDark: { color: '#F8FAFC' },
  separator: {
    height: 1,
    backgroundColor: '#EEE7FF',
    marginVertical: 4,
  },
  logoutItem: {
    backgroundColor: '#FFF5F5',
  },
  logoutText: {
    color: colors.danger,
  },
});
