# Frontend engineering handover

The Pink Plug is an Expo/React Native frontend for community discovery, places/events, route planning and safety resources. This handover preserves UI and behavior. Backend-dependent flows remain prototypes; frontend completion does not mean production services exist.

## Architecture

expo-router/entry loads file routes in app/. Root layout provides safe areas, theme/navigation theme, React Query, fonts, splash and the Expo update lifecycle. Tabs implement Home, Explore, Community and Route; Profile is a hidden tab reachable through navigation. Typed helpers live in src/navigation and safe-area/tab calculations in src/layout. Dynamic event/place routes derive IDs but currently fall back to fixture data when missing.

src/components separates reusable UI, motion, splash, maps, reviews, cards and campaign UI. src/constants defines design tokens; StyleSheet, NativeWind/Tailwind and CSS provide presentation. Theme context is local; web storage behavior needs QA. Preserve native/web variants and iOS-specific safe-area/transparent-surface fixes.

useAppStore holds local auth, route state, reviews and UI controls; a second store holds emergency contacts. AsyncStorage is the persistence layer, not a backend. React Query has a provider but no application API client. Services implement device contacts/sharing and mock OTP. No root components/screens/assets/hooks/services/utils/types folders exist; code lives under app and src.

## Data and forms

Bundled fixtures are in src/data and inline arrays throughout screens. Local assets live under src/imports with Git LFS; some catalogues use external images. Forms use component state and explicit validation. Register has no password field; event and campaign forms differ; contact setup validation differs from the contacts screen. Use [screen mapping](SCREEN-API-MAPPING.md), [models](DATA-MODELS.md) and [API specification](API-SPECIFICATION.md) to replace mocks without inventing features.

Authentication/session/recovery/security details: [AUTHENTICATION.md](AUTHENTICATION.md). Image selection and simulated verification: [MEDIA-UPLOADS.md](MEDIA-UPLOADS.md). Error/loading/retry conventions: [ERROR-HANDLING.md](ERROR-HANDLING.md). Current timers and optimistic local success must become confirmed API state during deliberate integration, not cleanup.

## Platform differences

Web maps use React Leaflet; native maps embed Leaflet in WebView. Native loads external map scripts/tiles; provider availability, attribution and failure behavior need verification. Web/native motion implementations differ intentionally. Native contacts use the OS picker; web sharing uses navigator.share with fallback. Web image selection uses file inputs; native uses Expo permissions. iOS tab safe areas and native navigator transparency have dedicated code and need physical-device regression tests.

[EXPO-EAS.md](EXPO-EAS.md) records builds, runtime and updates. No native project generation or cloud publishing happened here. iOS identity, development client and production channel policy remain open.

## Integration sequence and ownership

1. Agree identity/session/provisioning, environments and privacy ownership.
2. Implement one API client and secure session bootstrap using the established envelopes; integrate private profile/settings/media/contacts.
3. Replace catalogue, community, review and campaign fixtures with authoritative queries and confirmed mutations; implement pagination and empty/error states.
4. Decide conditional routing/location/push services separately; do not imply delivery, dispatch or live tracking from existing labels.
5. Add appropriate tests and complete Android/iOS QA, signing, release and handover review.

No database schema or backend framework is mandated. See [known issues](KNOWN-ISSUES.md), [security audit](SECURITY-AUDIT.md), [codebase audit](CODEBASE-AUDIT.md) and [checklist](HANDOVER-CHECKLIST.md). Name owners for backend/identity, mobile/release, product/safety/privacy, frontend QA, design assets and operations. Remaining technical debt includes absent lint/tests, unused candidates, formatting, duplicated local domain state and mocked production controls.
