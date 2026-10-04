import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAppStore, useAuthState } from '@/store/useAppStore';
import * as authService from '@/services/authService';
import { ApiError } from '@/services/api';

export default function Index() {
  const { hasHydrated, isAuthenticated } = useAuthState();

  useEffect(() => {
    if (!hasHydrated) return;

    router.replace(isAuthenticated ? '/(tabs)/home' : '/onboarding');
  }, [hasHydrated, isAuthenticated]);

  // The persisted isAuthenticated flag only reflects local state; confirm the
  // session is still valid server-side (it may have been revoked, expired, or
  // the password changed elsewhere) and refresh the signed-in user/session.
  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;

    let cancelled = false;
    authService.getSession()
      .then(({ user, session }) => {
        if (cancelled) return;
        useAppStore.getState().setUser(user);
        useAppStore.getState().setSession(session);
      })
      .catch((error) => {
        if (cancelled) return;
        // Only an explicit rejection from the server (expired/revoked/invalid session) should sign
        // the person out; a network hiccup shouldn't evict someone who was already signed in.
        if (error instanceof ApiError) {
          useAppStore.getState().logout();
          router.replace('/login');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, isAuthenticated]);

  return null;
}
