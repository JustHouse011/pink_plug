import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthState } from '@/store/useAppStore';

export default function Index() {
  const { hasHydrated, isAuthenticated } = useAuthState();

  useEffect(() => {
    if (!hasHydrated) return;

    router.replace(isAuthenticated ? '/(tabs)/home' : '/onboarding');
  }, [hasHydrated, isAuthenticated]);

  return null;
}
