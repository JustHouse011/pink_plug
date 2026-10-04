import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type FirebaseApp, getApps, initializeApp } from 'firebase/app';
import {
  type Auth,
  connectAuthEmulator,
  getAuth,
  initializeAuth,
} from 'firebase/auth';
// getReactNativePersistence exists on the RN build at runtime (Metro resolves the
// "react-native" package-exports condition, @firebase/auth/dist/rn/index.js) but is
// omitted from firebase/auth's platform-neutral public .d.ts rollup used for
// type-checking (see @firebase/auth/dist/rn/index.rn.d.ts for the real signature).
// @ts-expect-error — not in the public types, but present at runtime on native.
import { getReactNativePersistence } from 'firebase/auth';

/**
 * Firebase Web app config. The demo-* defaults match pink_plug_backend's default
 * emulator project (demo-pink-plug, see pink_plug_backend/README.md) so local
 * development works against the emulators with no real Firebase project. Override
 * via EXPO_PUBLIC_FIREBASE_* in .env.local (see .env.example) for a real project.
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'demo-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'demo-pink-plug.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-pink-plug',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'demo-pink-plug.appspot.com',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? 'demo-app-id',
};

const useAuthEmulator = process.env.EXPO_PUBLIC_USE_AUTH_EMULATOR === 'true';
const authEmulatorHost = process.env.EXPO_PUBLIC_AUTH_EMULATOR_HOST ?? 'http://127.0.0.1:9099';

export const firebaseApp: FirebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);

/**
 * Native (iOS/Android) needs an explicit AsyncStorage-backed persistence so a
 * signed-in session survives app restarts; web uses the SDK's own browser
 * persistence. initializeAuth throws if called twice for the same app (e.g. on
 * Fast Refresh), so fall back to the already-initialized instance.
 */
function createAuth(): Auth {
  if (Platform.OS === 'web') return getAuth(firebaseApp);

  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(firebaseApp);
  }
}

export const firebaseAuth: Auth = createAuth();

let emulatorConnected = false;
if (useAuthEmulator && !emulatorConnected) {
  connectAuthEmulator(firebaseAuth, authEmulatorHost, { disableWarnings: true });
  emulatorConnected = true;
}
