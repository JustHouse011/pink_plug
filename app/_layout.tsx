import 'react-native-gesture-handler';
import '@/global.css';
import { Suspense } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular } from '@expo-google-fonts/inter';
import { colors } from '@/constants/colors';
import AppHeader from '@/components/ui/AppHeader';
import { useAppStore } from '@/store/useAppStore';
import { ThemeProvider, useTheme } from '@/context/ThemeProvider';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppLayout />
    </ThemeProvider>
  );
}

function AppLayout() {
  useFonts({ Inter_400Regular });
  const { isDark } = useTheme();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const isLoggingOut = useAppStore((state) => state.isLoggingOut);
  const headerMenuVisible = useAppStore((state) => state.headerMenuVisible);
  const setHeaderMenuVisible = useAppStore((state) => state.setHeaderMenuVisible);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {headerMenuVisible && (
        <Pressable
          className="theme-dismiss-layer"
          style={styles.dismissLayer}
          onPress={() => setHeaderMenuVisible(false)}
          accessibilityRole="button"
          accessibilityLabel="Close header menu"
        />
      )}
      {isLoggingOut && (
        <View style={styles.loggingOutOverlay} pointerEvents="none">
          <View style={styles.loggingOutCard}>
            <Text style={styles.loggingOutText}>Logging out…</Text>
          </View>
        </View>
      )}
      <View style={styles.headerLayer}>
        <AppHeader />
      </View>
      <Suspense fallback={<View style={styles.loader} />}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            animationDuration: 250,
            gestureEnabled: true,
            contentStyle: {
              backgroundColor: isDark ? '#0A0712' : colors.background,
              paddingTop: 0,
            },
          }}
        />
      </Suspense>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  dismissLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  headerLayer: {
    zIndex: 30,
  },
  loader: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loggingOutOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    backgroundColor: 'rgba(18, 12, 25, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loggingOutCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(230, 60, 216, 0.18)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  loggingOutText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
});
