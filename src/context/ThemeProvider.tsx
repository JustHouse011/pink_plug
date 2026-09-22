import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Appearance, Platform } from 'react-native';
import { colors, darkColors } from '@/constants/colors';

export type ThemePreference = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
  isDark: boolean;
  palette: typeof colors | typeof darkColors;
};

const STORAGE_KEY = 'pink-route-theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredTheme(): ThemePreference {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return 'dark';

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'dark';
  } catch {
    return 'dark';
  }
}

function getDefaultTheme(): ThemePreference {
  return 'dark';
}

function getSystemIsDark() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  return Appearance.getColorScheme() === 'dark';
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<ThemePreference>(getDefaultTheme);
  const [systemIsDark, setSystemIsDark] = useState(getSystemIsDark);
  const isDark = theme === 'dark' || (theme === 'system' && systemIsDark);
  const palette = isDark ? darkColors : colors;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage can be unavailable in private browsing or embedded previews.
    }
  }, [theme]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (event: MediaQueryListEvent) => setSystemIsDark(event.matches);
      mediaQuery.addEventListener?.('change', handleChange);
      return () => mediaQuery.removeEventListener?.('change', handleChange);
    }

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemIsDark(colorScheme === 'dark');
    });
    return () => subscription.remove();
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    setTheme: setThemeState,
    toggleTheme: () => setThemeState((current) => (current === 'dark' ? 'light' : 'dark')),
    isDark,
    palette,
  }), [isDark, palette, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
