# Expo and EAS

Verified from app.json, eas.json, package.json and app/_layout.tsx on 23 September 2026. No remote channel/branch mappings, signing access or native builds were verified.

| Setting | Actual repository value |
| --- | --- |
| Expo SDK | 57; expo ~57.0.24 |
| Name / slug | The Pink Plug / the-pink-plug |
| Owner / project ID | bongz011 / d65a7047-e0ce-4a6a-a0d0-ccac063ea7bd |
| Android package | com.bongz011.thepinkplug |
| iOS bundle identifier | Not configured |
| Scheme | pinkplug |
| App version / runtime policy | 1.0.0 / appVersion; local resolved policy corresponds to 1.0.0 |
| EAS version source | remote; verify actual build version/runtime before publishing |
| Platforms | Android, iOS and web |
| Development profile | developmentClient true, internal, channel development |
| Preview profile | internal, Android APK, channel preview |
| Production profile | autoIncrement true, channel preview |
| Submit | Empty production settings |
| EAS CLI minimum | 24.7.0 |

The supplied assumption that the remote branch is preview is unverified. A channel name does not establish its remote branch mapping. Inspect it with authorized EAS access before publishing. No .easignore exists: .gitignore controls EAS upload exclusions. No checked-in native directories exist, and this task did not run prebuild.

## Local development

```sh
npm ci
npm start
npx expo start --clear
npm run android
npm run ios
npm run web
npm run typecheck
```

Use npm install when intentionally changing dependencies; retain package-lock.json. Node 22 is selected by .mise.toml; use at least 22.13.0 according to installed React Native's engine requirement. Android/iOS scripts request launch from Metro; they do not compile native binaries. iOS simulator requires macOS/Xcode. Expo Go/device compatibility needs testing. expo-dev-client is absent despite the development profile; resolve this before using that profile.

## Build and export

```sh
npx expo export --platform all --output-dir dist
eas build --platform android --profile preview
eas build --platform ios --profile preview
eas build --platform android --profile production
eas build --platform ios --profile production
```

EAS commands submit cloud builds and require project/account/signing access. Define ios.bundleIdentifier first. After development-client setup, the development profile can be used. Successful JS/assets export is not proof of native compilation or device behavior.

## Updates

updates.enabled is true, checkAutomatically is NEVER and fallbackToCacheTimeout is 0. Release-mode source manually checks, fetches and reloads updates; OTA is not disabled. Both preview and production currently select preview channel. Resolve release separation deliberately.

Inspect remote mapping with `eas channel:view preview` and `eas branch:list`. After confirming targeting and runtime compatibility, an authorized operator may publish `eas update --channel preview --message "Approved update description"`. This publishes an update; it is not a validation command and was not executed. A branch-targeted command is appropriate only after confirming that branch serves the intended channel.

Native dependency/configuration changes require a compatible binary and runtime decision. Test offline startup, reload timing, rollback, splash, permissions and installed update behavior on Android and iOS. Signing material belongs outside the repository.
