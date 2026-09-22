# The Pink Plug

## Overview

The Pink Plug is a mobile-first application for LGBTQIA+ community discovery, events, places, travel planning, and safety resources, with a web implementation. The repository contains an Expo frontend with local state and mock data. Authentication and backend-dependent features are prototypes, not production services.

Read [HANDOVER.md](HANDOVER.md) for release blockers, validation evidence, and engineering decisions. The [API specification](docs/API_DOCUMENTATION.md) defines the proposed frontend/backend handover contract, including conditional scope and unresolved decisions; it does not describe deployed APIs. The [original API requirements draft](docs/API_REQUIREMENTS_DRAFT.md) is retained for reference.

## Technology Stack

Versions below are declared in `package.json`; resolved versions are recorded in `package-lock.json`.

| Technology | Version / use |
| --- | --- |
| React Native / React | `0.86.3` / `19.2.3` |
| Expo | `~57.0.24` (SDK 57) |
| Expo Router | `~57.0.22`; file-based stack/tab navigation and typed routes |
| TypeScript | `~6.0.3`; strict checking |
| EAS | Build profiles and Expo Updates configuration |
| Zustand / AsyncStorage | Local application state and persistence |
| TanStack React Query | Query provider infrastructure; does not establish backend integration |
| NativeWind / Tailwind CSS | Styling alongside React Native styles |
| Reanimated / Worklets / Gesture Handler | Native animation and interaction |
| Framer Motion | Web motion components |
| Leaflet / React Leaflet | Web maps; native map implementation embeds Leaflet in a WebView |
| Expo modules | Fonts, icons, images, image picker, contacts, blur, gradients, splash, and updates |
| React Native Web | Browser support |
| oxfmt | Formatting; no configured linter |

`react-native-maps` is installed but is not the map implementation currently used by the inspected source.

## Prerequisites

- Node.js: `.mise.toml` selects major version **22**. The installed React Native package requires `^20.19.4 || ^22.13.0 || ^24.3.0 || >=25.0.0`; use at least **22.13.0** on the configured Node 22 line. The handover audit ran with Node **24.14.1**; Node 22 was not separately tested.
- npm: required for the commands below. The project does not pin an npm version or declare a `packageManager`; the audit environment used **11.11.0**. Preserve the npm lockfile. `.mise.toml` also lists pnpm **10.34.3** for the retained Figma workflow; do not create a competing lockfile without team agreement.
- Git and Git LFS: image assets use LFS. Ensure LFS objects are downloaded after cloning; pointer files are not usable images.
- Expo CLI: provided by the local `expo` dependency and invoked through npm scripts or `npx expo`; no legacy global Expo CLI is required.
- EAS CLI: **>=24.7.0**, as required by `eas.json`, plus authorized access to the configured Expo project for cloud builds or updates.
- Android: an appropriate physical-device client or an Android emulator/SDK environment.
- iOS: a physical-device client, or macOS/Xcode for the iOS simulator. Native signing and distribution require the appropriate Apple account access.

## Installation

After cloning and entering the repository:

```sh
git lfs install
git lfs pull
npm install
npm start
```

For an unchanged lockfile in CI or a reproducible clean installation, use `npm ci` instead of `npm install`. Do not run installation concurrently with a running dependency update. Review any lockfile changes before including them in a handover.

## Development

These are the actual scripts in `package.json`:

| Command | Behavior |
| --- | --- |
| `npm start` | Start Expo development server |
| `npm run android` | Start Expo and request Android launch |
| `npm run ios` | Start Expo and request iOS launch |
| `npm run web` | Start Expo web development |
| `npm run typecheck` | Run `tsc --noEmit` |
| `npm run format` | Run oxfmt; this may rewrite files |

Use `npm run format -- --check app src` to inspect formatting without rewriting source. There are no `dev`, `build`, or `test` package scripts. Expo startup regenerates ignored Router types under `.expo/types`.

## Type Checking

```sh
npm run typecheck
```

The configuration extends `expo/tsconfig.base`, enables strict checking, and maps `@/*` to `src/*`. Typed routes are enabled in `app.json`. Generate route types through Expo startup when preparing a fresh checkout for route type checking.

## Linting

No lint script or linter configuration is present. oxfmt checks formatting, not semantic lint rules. No automated test suite was found during the handover audit.

## Project Structure

```text
app/                       Expo Router routes and layouts
  (tabs)/                  Home, Explore, Community, Route, Profile
  events/[id].tsx          Event detail route
  places/[id].tsx          Place detail route
src/
  components/             UI, maps, motion, splash, and feature components
  constants/              Colors, spacing, typography, radius, motion, glass styles
  context/                Theme provider
  data/                   Mock and directory data
  imports/                Application images and design assets
  layout/                 Shared tab/safe-area layout helpers
  navigation/             Typed route helpers
  services/               Contacts, sharing, mock OTP
  store/                  Zustand state and AsyncStorage persistence
  types/                  Application types and declarations
  global.css              Shared styling
docs/                     API specification and retained requirements draft
.figma/make/               Retained Figma Make tooling; not application source
app.json                  Expo application configuration
eas.json                  EAS profiles
metro.config.js           Metro, NativeWind, and SVG transformation
babel.config.js           Expo/NativeWind and Worklets configuration
tsconfig.json             TypeScript configuration
```

There is **no top-level `assets/` directory** in the audited tree; assets live primarily in `src/imports/`. There are no checked-in `ios/` or `android/` projects. Generated exports, caches, and installed dependencies are not application source.

## Environment Variables

No project `.env` files or required backend environment-variable contract were identified in the audit. Do not invent backend URLs or credentials to run the current mock frontend.

When backend integration is designed, document required variable names, owners, and environment-specific values. Client-visible `EXPO_PUBLIC_*` values are embedded in the application and must not contain secrets. Keep server credentials out of client code and use the agreed secure build/backend environment configuration.

The current `.env*` ignore rule excludes local environment files **and example files**. A sanitized `.env.example` is recommended only after the contract is defined; explicitly approve an ignore exception at that time. No example file or ignore change is included in this documentation handover.

## Expo / EAS

| Setting | Current value |
| --- | --- |
| Name / slug | The Pink Plug / `the-pink-plug` |
| Expo owner | `bongz011` |
| EAS project ID | `d65a7047-e0ce-4a6a-a0d0-ccac063ea7bd` |
| URL scheme | `pinkplug` |
| Android package | `com.bongz011.thepinkplug` |
| iOS bundle identifier | Not configured; requires an engineering decision |
| App version | `1.0.0` |
| Version source | EAS remote |
| Runtime version | `appVersion` policy |

These identifiers are project metadata, not credentials. Account access and signing ownership must be transferred separately.

| Build profile | Current configuration |
| --- | --- |
| `development` | Development client, internal distribution, `development` channel |
| `preview` | Internal distribution, Android APK, `preview` channel |
| `production` | Auto-increment enabled, **`preview` channel** |

The production channel assignment is the actual configuration, not a recommendation. Review release separation before publishing. `submit.production` exists but has no explicit settings. No `.easignore` exists, so EAS uses `.gitignore` for upload exclusions.

## Running Android

```sh
npm run android
```

This starts Metro and requests Android launch; it does not compile an APK. An appropriate device/emulator client must be available. The configured development-client workflow is incomplete because `expo-dev-client` is not declared. Engineers must resolve that before relying on the `development` build profile. Expo Go compatibility and device behavior were not established by the export audit.

## Running iOS

```sh
npm run ios
```

Simulator launch requires macOS and Xcode; Windows cannot run the iOS simulator. A physical iPhone can use a compatible installed client with the development server, subject to network and client compatibility. Before native builds, define `ios.bundleIdentifier`, signing ownership, and distribution access. The development-client gap described above also applies to iOS.

## Builds

These commands use the existing profiles and submit actual cloud build requests; they were **not run** during the handover audit:

```sh
eas build --platform android --profile preview
eas build --platform android --profile production
eas build --platform ios --profile preview
eas build --platform ios --profile production
```

Once development-client prerequisites are resolved:

```sh
eas build --platform android --profile development
eas build --platform ios --profile development
```

For production JavaScript/assets export without generating native projects:

```sh
npx expo export --platform all --output-dir dist
```

Export success is not native build/signing success. No Gradle/Xcode build, store submission, or `expo prebuild` was performed during this handover.

Useful non-native configuration checks:

```sh
npx expo config --type public
npx expo config --type introspect
npx expo install --check
```

The compatibility check currently flags `react-native-svg` 15.15.5 versus Expo's expected 15.15.4. See [HANDOVER.md](HANDOVER.md).

## OTA Updates

`expo-updates` is configured for the EAS project above. Automatic launch checking is set to `NEVER`, with a zero cache fallback timeout. However, `app/_layout.tsx` manually checks, fetches, and reloads available updates outside development mode. OTA updates are therefore not disabled.

The checked-in profile channels are `development` and `preview`; production builds currently also use `preview`. Remote channel-to-branch mappings were not inspected. After verifying targeting, access, and runtime compatibility, an operator can publish with `eas update --channel <approved-channel> --message "<release description>"`. This is a publishing operation, not a local validation command.

Native dependency or configuration changes require a compatible new native build and an explicit runtime/version decision. Test update application, reload timing, offline startup, and rollback before release.

## Git Workflow

- Preserve source, configuration, `package-lock.json`, and required runtime assets, including LFS objects.
- Do not commit `node_modules/`, `.expo/`, `.idea/`, `dist/`, `build/`, caches, logs, local environment files, or secrets; current exclusions are in `.gitignore`.
- Keep `.vscode/extensions.json` as the current shared editor recommendation.
- Retain `.figma/` until engineering/design decide whether Figma Make remains supported.
- Do not introduce `/ios/` or `/android/` ignore rules without agreeing the native-project policy.
- Before preparing a handover commit, review staged and unstaged changes separately. At audit time, required `src/layout/tabLayout.ts` was untracked and several files had additional unstaged edits. The validated working tree is not identical to the staged snapshot.
