import type { Href } from 'expo-router';

export const routes = {
  home: '/(tabs)/home',
  explore: '/(tabs)/explore',
  community: '/(tabs)/community',
  route: '/(tabs)/route',
  directory: '/directory',
  travel: '/travel',
  safety: '/safety',
  settings: '/settings',
  emergencyContacts: '/emergency-contacts',
  changePassword: '/change-password',
  manageSessions: '/manage-sessions',
  privacySettings: '/privacy-settings',
} as const satisfies Record<string, Href>;

export const placeRoute = (id: string) => `/places/${id}` as const satisfies Href;
export const eventRoute = (id: string) => `/events/${id}` as const satisfies Href;
