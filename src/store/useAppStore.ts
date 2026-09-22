import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { Event, Place, Review, Tab, TransitMode, Waypoint } from '@/types';

type ReviewTarget = 'event' | 'place';

interface AppState {
  hasHydrated: boolean;
  activeTab: Tab;
  onboardingComplete: boolean;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  shareLocation: boolean;
  headerMenuVisible: boolean;
  showNotifications: boolean;
  waypoints: Waypoint[];
  transitMode: TransitMode;
  selectedPlace: Place | null;
  selectedEvent: Event | null;
  reviewCache: Record<string, Review[]>;
  completeOnboarding: () => void;
  login: () => void;
  logout: () => void;
  setLoggingOut: (value: boolean) => void;
  setLocationSharing: (value: boolean) => void;
  setActiveTab: (tab: Tab) => void;
  setHeaderMenuVisible: (value: boolean) => void;
  setShowNotifications: (value: boolean) => void;
  addWaypoint: (place: Place) => void;
  removeWaypoint: (id: string) => void;
  setTransitMode: (mode: TransitMode) => void;
  selectPlace: (place: Place) => void;
  selectEvent: (event: Event) => void;
  addReview: (target: ReviewTarget, targetId: string, review: { rating: number; headline: string; comment: string }) => void;
  setHasHydrated: (value: boolean) => void;
}

const STORAGE_KEY = 'pink-plug-store';

const resetAuthState = (): Pick<AppState, 'activeTab' | 'isAuthenticated' | 'shareLocation' | 'headerMenuVisible' | 'showNotifications' | 'onboardingComplete'> => ({
  onboardingComplete: false,
  isAuthenticated: false,
  activeTab: 'home',
  shareLocation: false,
  headerMenuVisible: false,
  showNotifications: false,
});

export const useAppStore = create<AppState>((set) => ({
  hasHydrated: false,
  activeTab: 'home',
  onboardingComplete: false,
  isAuthenticated: false,
  isLoggingOut: false,
  shareLocation: false,
  headerMenuVisible: false,
  showNotifications: false,
  waypoints: [],
  transitMode: 'walking',
  selectedPlace: null,
  selectedEvent: null,
  reviewCache: {},
  completeOnboarding: () => set({ onboardingComplete: true }),
  login: () => set({ isAuthenticated: true, isLoggingOut: false }),
  logout: () => {
    set((state) => ({
      ...state,
      ...resetAuthState(),
      isLoggingOut: true,
      waypoints: [],
      transitMode: 'walking',
      selectedPlace: null,
      selectedEvent: null,
      reviewCache: {},
    }));
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
  },
  setLoggingOut: (isLoggingOut) => set({ isLoggingOut }),
  setLocationSharing: (shareLocation) => set({ shareLocation }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setHeaderMenuVisible: (headerMenuVisible) => set({ headerMenuVisible }),
  setShowNotifications: (showNotifications) => set({ showNotifications }),
  addWaypoint: (place) => set((state) => state.waypoints.some((item) => item.place.id === place.id) ? state : ({ waypoints: [...state.waypoints, { id: `wp-${Date.now()}`, place, order: state.waypoints.length }] })),
  removeWaypoint: (id) => set((state) => ({ waypoints: state.waypoints.filter((item) => item.id !== id) })),
  setTransitMode: (transitMode) => set({ transitMode }),
  selectPlace: (selectedPlace) => set({ selectedPlace }),
  selectEvent: (selectedEvent) => set({ selectedEvent }),
  addReview: (target, targetId, review) => set((state) => {
    const key = `${target}:${targetId}`;
    const existing = state.reviewCache[key] ?? [];

    const nextReview: Review = {
      id: `review-${Date.now()}`,
      user: 'You',
      avatar: '⭐',
      rating: review.rating,
      headline: review.headline,
      comment: review.comment,
      timeAgo: 'Just now',
    };

    return {
      reviewCache: {
        ...state.reviewCache,
        [key]: [nextReview, ...existing],
      },
    };
  }),
  setHasHydrated: (hasHydrated) => set({ hasHydrated }),
}));

const persistedKeys = ['onboardingComplete', 'isAuthenticated', 'shareLocation', 'waypoints', 'transitMode', 'reviewCache'] as const;
type PersistedState = Pick<AppState, (typeof persistedKeys)[number]>;

AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
  if (!stored) return;

  try {
    const parsed = JSON.parse(stored) as Partial<PersistedState>;

    if (parsed.isAuthenticated === false) {
      useAppStore.setState({
        onboardingComplete: false,
        isAuthenticated: false,
        shareLocation: false,
      });
      return;
    }

    useAppStore.setState(parsed);
  } catch {
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
  }
}).catch(() => undefined).finally(() => {
  useAppStore.getState().setHasHydrated(true);
});

let persistTimer: ReturnType<typeof setTimeout> | undefined;

useAppStore.subscribe((state) => {
  if (!state.hasHydrated) return;

  if (!state.isAuthenticated) {
    if (persistTimer) clearTimeout(persistTimer);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
    return;
  }

  const persistedState = Object.fromEntries(persistedKeys.map((key) => [key, state[key]])) as PersistedState;
  const serializedState = JSON.stringify(persistedState);
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    AsyncStorage.setItem(STORAGE_KEY, serializedState).catch(() => undefined);
  }, 150);
});

export const useAuthState = () => useAppStore(useShallow((state) => ({
  isAuthenticated: state.isAuthenticated,
  onboardingComplete: state.onboardingComplete,
  hasHydrated: state.hasHydrated,
})));

export const useShellState = () => useAppStore(useShallow((state) => ({
  isLoggingOut: state.isLoggingOut,
  headerMenuVisible: state.headerMenuVisible,
  setHeaderMenuVisible: state.setHeaderMenuVisible,
  showNotifications: state.showNotifications,
  setShowNotifications: state.setShowNotifications,
})));

export const useRouteState = () => useAppStore(useShallow((state) => ({
  waypoints: state.waypoints,
  transitMode: state.transitMode,
  addWaypoint: state.addWaypoint,
  removeWaypoint: state.removeWaypoint,
  setTransitMode: state.setTransitMode,
})));
