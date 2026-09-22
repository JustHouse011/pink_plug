import 'react-native-gesture-handler';
import '@/global.css';
import { Suspense, useEffect, useState } from 'react';
import { Platform, Pressable, Text, View, StyleSheet } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider, useTheme as useNavigationTheme } from 'expo-router/react-navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular } from '@expo-google-fonts/inter';
import { colors, darkColors } from '@/constants/colors';
import { radius } from '@/constants/radius';
import { spacing } from '@/constants/spacing';
import AppHeader from '@/components/ui/AppHeader';
import AmbientBackground from '@/components/ui/AmbientBackground';
import AnimatedSplash from '@/components/splash/AnimatedSplash';
import { useShellState } from '@/store/useAppStore';
import { ThemeProvider, useTheme } from '@/context/ThemeProvider';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppLayout />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppLayout() {
  const [fontsLoaded] = useFonts({ Inter_400Regular });
  const [appReady, setAppReady] = useState(false);
  const [splashFinished, setSplashFinished] = useState(false);
  const { isDark } = useTheme();
  const inheritedNavigationTheme = useNavigationTheme();
  const baseNavigationTheme = isDark ? DarkTheme : DefaultTheme;
  // Native navigator surfaces must let the full-shell ambient layer show through.
  const navigationTheme = Platform.OS === 'ios'
    ? { ...baseNavigationTheme, colors: { ...baseNavigationTheme.colors, background: 'transparent' } }
    : inheritedNavigationTheme;
  const { isLoggingOut, headerMenuVisible, setHeaderMenuVisible } = useShellState();

  useEffect(() => {
    SplashScreen.preventAutoHideAsync().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!fontsLoaded) {
      return;
    }

    const timer = setTimeout(() => {
      setAppReady(true);
    }, 250);

    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  useEffect(() => {
    if (__DEV__) {
      return;
    }

    const applyAvailableUpdate = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          const fetchedUpdate = await Updates.fetchUpdateAsync();
          if (fetchedUpdate.isNew) {
            await Updates.reloadAsync();
          }
        }
      } catch (error) {
        console.warn('Failed to apply OTA update', error);
      }
    };

    applyAvailableUpdate();
  }, []);

  useEffect(() => {
    if (!splashFinished) {
      return;
    }

    SplashScreen.hideAsync().catch(() => undefined);
  }, [splashFinished]);

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationThemeProvider value={navigationTheme}>
      <View style={[styles.appShell, Platform.OS === 'ios' && { backgroundColor: isDark ? darkColors.background : colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <AmbientBackground />
        {!splashFinished && <AnimatedSplash ready={appReady} onAnimationComplete={() => setSplashFinished(true)} />}
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
            initialRouteName="index"
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_left',
              animationDuration: 350,
              gestureEnabled: true,
              contentStyle: {
                backgroundColor: 'transparent',
                paddingTop: 0,
              },
            }}
          >
            <Stack.Screen
              name="places/[id]"
              options={{ animation: 'slide_from_left', animationDuration: 350 }}
            />
            <Stack.Screen
              name="events/[id]"
              options={{ animation: 'slide_from_left', animationDuration: 350 }}
            />
          </Stack>
        </Suspense>
      </View>
      </NavigationThemeProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'transparent',
  },
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
    backgroundColor: 'transparent',
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
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
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
