import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      // Don't retry client errors (401/403/404/422); do retry transient failures.
      retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
    },
  },
});

// Cached responses are user-scoped (saved places, contacts, notifications…): drop them on sign-out.
useAppStore.subscribe((state, prev) => {
  if (prev.isAuthenticated && !state.isAuthenticated) queryClient.clear();
});
