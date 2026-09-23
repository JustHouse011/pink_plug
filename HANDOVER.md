# The Pink Plug — Engineering Handover

## Handover Status

This document records the repository audit performed on 22 September 2026. It describes the current working tree, not a committed release or production certification. Documentation preparation did not change application behavior, dependencies, configuration, or Git staging.

| Area | Status |
| --- | --- |
| Implemented | Expo Router screens, navigation, themed UI, map presentations, splash animation, local state, contact-picker integration, and share integration |
| Prototype/mock | Authentication, OTP, alternative sign-in, user/session data, community/content flows, route scenarios, and multiple settings interactions |
| Pending backend integration | Production identity, profiles, content, reviews, contact verification, privacy/session controls, and server-backed safety workflows |
| Pending production configuration | iOS identity, development-client setup, release-channel decision, signing/ownership verification, and environment contract |
| Pending native/device validation | Android/iOS compilation and installation, permissions, splash, navigation, maps, responsive behavior, and OTA lifecycle |

The working tree passes type checking and all-platform production export. It is a frontend prototype handover with explicit outstanding work, not a production-ready service.

## Implemented Application Areas

| Area | Implemented surface and limitations |
| --- | --- |
| Entry and onboarding | Hydration-aware entry redirect, onboarding, login, registration, profile setup; authentication remains local/mock |
| Navigation | Expo Router root stack, Home/Explore/Community/Route/Profile tabs, place/event detail routes, and secondary settings/safety/directory/travel screens |
| Home / Explore / Directory | Discovery UI, cards, browsing, and content presentation driven by bundled data |
| Community / Events / Places | Community and detail interfaces; production content, posting, and review persistence are not server-backed |
| Profile / Settings | Profile UI, theme handling, password/privacy/session screens; no production account-security service |
| Routes / Travel | Map presentation, waypoints and route UI; native WebView Leaflet and web React Leaflet, with predefined/mock route data rather than validated live navigation |
| Emergency contacts | Manual entry and native contact-picker service, phone normalization, local persistence, and a five-contact UI limit; no proven server verification or emergency dispatch |
| Safety resources | Bundled resources, website/phone links; SOS opens `tel:112`, and safe-walk navigation opens the route screen |
| Sharing | Web Share API where available and React Native Share fallback; delivery, recipient receipt, and live location tracking are not established |
| Presentation | Theme provider, reusable components, native/web motion, native splash configuration, and an animated application splash |

An implemented control is not evidence that its implied backend or real-world service exists. In particular, SOS is a dialer link, not monitored emergency response.

## Platform Status

### Android

- Configured package: `com.bongz011.thepinkplug`.
- Expo configuration introspection and production export, including Hermes bytecode, passed.
- Introspection includes contacts permissions and `RECORD_AUDIO`; review least-privilege requirements.
- No `android/` project is present. No Gradle compilation, APK installation, emulator/device acceptance, signing, or Play submission was tested in this audit.
- `npm run android` starts Expo and requests launch; it does not compile a native application.

### iOS

- Production export, including Hermes bytecode, and configuration introspection passed.
- No explicit `ios.bundleIdentifier` is set; introspection includes a placeholder application scheme. Define the actual identity before build handover.
- Photo/camera descriptions are configured. Introspection also resolves contacts and microphone descriptions through installed plugins; contacts permission was not found missing.
- No `ios/` project is present. Xcode compilation, installation, signing, entitlements, App Store submission, and physical-device behavior remain unvalidated.
- Simulator development requires macOS/Xcode. Development-client configuration is incomplete as described below.

### Web

- Production web export passed; the application has web-specific map and motion components.
- Leaflet CSS export reported unsupported local resource URLs for marker/layer images. Current markers use custom HTML icons; inspect controls and styles in a browser.
- Map tiles, native WebView Leaflet scripts/styles, and some content images use external services. Availability, offline behavior, licensing/attribution, and production hosting policy require review.
- Export is not browser acceptance testing. Responsive layouts, accessibility, share fallback, deep links, and direct-route hosting behavior still require validation.

### Validation Evidence

| Check | Audit result |
| --- | --- |
| `npm run typecheck` | Passed |
| Manifest versus lockfile | Root declarations match; direct locked versions satisfy declared ranges |
| `npm ls --depth=0` | Passed |
| Expo public configuration | Passed |
| Expo native introspection | Passed; no native projects generated |
| Installed EAS JSON schema validation | Passed |
| `expo export --platform all` | Passed after sandbox permission allowed the installed Hermes compiler to execute |
| `expo install --check` | Failed on one compatibility mismatch: SVG 15.15.5 versus expected 15.15.4 |
| Existing formatter in check-only mode | Reported formatting issues in 72 files; no rewriting performed |
| Lint / automated tests | No configured lint command or test suite found |
| Static imports/assets | No missing static local imports; configured images and export assets resolved |
| Current-file secret/path scan | No likely exposed credentials, tracked `.env`, application localhost endpoints, or machine-specific application paths found |

The scan did not establish historical-secret cleanliness, dependency vulnerability status, remote LFS availability, remote service uptime, or native runtime correctness. Audit Node/npm versions were 24.14.1 / 11.11.0; `.mise.toml` selects Node 22, which was not separately tested.

## Authentication

Authentication is a prototype:

- `src/services/mockOtpService.ts` generates and checks codes in local memory using `Math.random()`; there is no delivery/authentication server.
- Login checks that a password is nonempty, not that a server validates it.
- Codes are exposed in the UI/alerts for demonstration.
- `app/login.tsx` accepts any six-digit OTP once a mock code has been generated, as an alternative to matching the expected code.
- Alternative sign-in options are simulated; they do not establish verified provider or biometric identity.
- Zustand and AsyncStorage maintain local authentication state. That state is not an authorization boundary or secure token store.

Replace these flows before production. Engineers must choose the identity provider, server authorization model, token/session lifecycle, secure storage, rate limits, recovery, and verification design. Prototype handover is acceptable only with this limitation explicit.

## API / Backend Integration

Use [docs/API-SPECIFICATION.md](docs/API-SPECIFICATION.md) as the frontend-derived API handover specification. It defines proposed contracts, current-flow versus planned scope, model fields, security requirements, and open engineering decisions. It does not claim any backend endpoint is deployed. The original draft is available in Git history at cdb1607; its later working-tree deletion was made outside this cleanup. The specification includes a reconciliation of its requirements.

Areas requiring backend integration include identity/OTP, profiles, places/events/directory content, community actions, reviews, session management, privacy/security controls, and verified contact/safety workflows. `src/data/` holds bundled/mock content. Stores persist selected state locally; review state and contacts are not a shared production database. React Query provider setup does not imply an implemented API client.

Decide data ownership, migrations, deletion/retention behavior, authorization, pagination, offline behavior, and error handling before replacing the mocks.

## Safety-Critical Features

| Feature | Review required before production |
| --- | --- |
| Emergency contacts | Consent, permission denial, phone normalization, verification, persistence security, deletion, and recipient notification guarantees |
| SOS | Confirm dialer behavior and regional emergency-number handling; never imply dispatch/monitoring that is not implemented |
| Location/maps/safe walk | Distinguish fixed/mock positions from real location; validate permissions, accuracy, routes, background operation if required, and failure modes |
| Sharing | Confirm exactly what is shared, user consent, URL destinations, cancellation/fallback, and sensitive-data exposure |
| Authentication | Remove bypasses and demo code disclosure; implement server-verified identity and authorization |
| Privacy/security | Replace simulated settings/session controls with enforceable behavior; review local storage, transport, retention, and account deletion |
| OTA updates | Validate targeting, compatibility, reload timing, failure recovery, and release access control |

Native introspection also reports permissive iOS transport settings. Review the final release configuration rather than assuming the introspection output represents an approved security policy.

## Expo / EAS

### Identity and Ownership

| Setting | Repository value |
| --- | --- |
| Expo owner | `bongz011` |
| Slug | `the-pink-plug` |
| EAS project ID | `d65a7047-e0ce-4a6a-a0d0-ccac063ea7bd` |
| Android application ID | `com.bongz011.thepinkplug` |
| iOS application ID | Not configured |
| URL scheme | `pinkplug` |
| App version / runtime policy | `1.0.0` / `appVersion` |
| EAS CLI / version source | `>=24.7.0` / remote |

These are non-secret identifiers. Actual Expo membership, Apple/Google ownership, signing credentials, provisioning, store records, and access-transfer procedures cannot be established from the repository.

### Profiles and Updates

- `development`: internal distribution, `developmentClient: true`, channel `development`.
- `preview`: internal distribution, Android APK, channel `preview`.
- `production`: auto-increment, channel **`preview`**. A separate production channel is not configured here.
- `submit.production`: empty settings object; submission readiness is not established.

`expo-dev-client` is absent from package dependencies. Resolve the configured development-client workflow before relying on it. Native projects are absent; agree the managed/generated native workflow and do not silently add native directories or ignore rules.

Updates are enabled with automatic launch checking set to `NEVER`; application code manually checks, fetches, and reloads outside development mode. The EAS endpoint uses the project ID above. Remote channel/branch mappings and available releases were not inspected. Agree preview/production isolation and runtime-version discipline before publishing updates.

See [README.md](README.md#build-commands) for profile commands. No cloud build, OTA publication, or signing operation was performed in this audit.

## Known Issues / Outstanding Work

### Handover Completeness and Build Prerequisites

1. `src/layout/tabLayout.ts` is required by tab screens but was untracked at audit time. Include it in the eventual approved handover snapshot.
2. Eleven application files have unstaged edits beyond their staged versions. The validated working tree differs from the index; review both before a future commit.
3. Define `ios.bundleIdentifier` and establish signing/account access before claiming reproducible iOS builds.
4. Resolve the missing development-client dependency/workflow before using the development profile.
5. Label the deliverable as a prototype until production authentication and backend integration are complete.

These items were recorded, not fixed, during documentation preparation.

### Production Blockers

- Mock authentication, OTP bypass, simulated provider/biometric sign-in, and unenforced backend-dependent privacy/session controls.
- No production backend/environment contract or demonstrated server authorization.
- No native build/signing/device acceptance evidence from this audit.
- Safety-related claims require validation against actual delivered behavior.
- Release channel targeting and OTA compatibility/rollback policy require explicit approval.

### Non-Blocking Recommendations

- Resolve or explicitly accept the `react-native-svg` compatibility warning with supporting tests; no blanket dependency upgrade is required.
- Agree formatting/lint/test policy. The formatter currently reports 72 files; do not apply a large reformat silently.
- Review development/type-only dependencies (`@expo/ngrok`, `@types/leaflet`) and unused direct dependency candidates (`react-hook-form`, `@hookform/resolvers`, `zod`, `react-native-maps`). Do not remove transitively required tooling based only on source searches.
- Review stale Vite references in `tsconfig.json` and `src/vite-env.d.ts`.
- Resolve `CLAUDE.md` referencing the deleted `AGENTS.md`.
- Review the single production OTA `console.warn` and update failure reporting.
- Visually verify Leaflet CSS resource warnings and external resource behavior.
- Review unreferenced asset candidates, including `src/imports/Untitled-1.png`, alternate splash images, and design originals. Do not delete required or intentionally retained design assets based on filenames alone.
- Review microphone permission necessity, contacts permission wording, and final release transport policy.
- Establish CI and Git LFS checkout verification. Remote LFS object availability was not checked.

## Production Checklist

- [ ] Capture the complete approved source snapshot, including the untracked layout helper and intended unstaged edits.
- [ ] Integrate production APIs and replace bundled/mock service behavior where required.
- [ ] Implement server-verified authentication, authorization, OTP, and session handling.
- [ ] Define environment configuration, deployment environments, and a sanitized variable template.
- [ ] Establish secret management and prevent credentials from entering client bundles or Git history.
- [ ] Configure and verify Android/iOS identities, ownership, signing, and provisioning.
- [ ] Resolve development-client workflow and dependency compatibility findings.
- [ ] Build, install, and test on Android devices.
- [ ] Build, install, and test on iOS devices.
- [ ] Perform responsive/device acceptance and accessibility testing.
- [ ] Verify native and animated splash timing, font loading, and failure recovery.
- [ ] Verify navigation, deep links, back behavior, tab insets, and authentication transitions.
- [ ] Verify maps/location, permission denial, external-resource failures, and route accuracy claims.
- [ ] Verify emergency contacts, sharing, and SOS behavior without implying unsupported guarantees.
- [ ] Verify privacy/session controls, data retention/deletion, and secure local persistence.
- [ ] Verify OTA channels, runtime compatibility, offline startup, reload timing, and rollback.
- [ ] Prepare store metadata, privacy disclosures, permission explanations, and submission access.
- [ ] Obtain engineering/product acceptance with known limitations documented.

## Design

`.figma/` is retained unchanged pending an engineering/design ownership decision. It contains nine files under `.figma/make/`: `analyze-routes`, `deploy`, `deploy-preview`, `dev`, `dev.json`, `format`, `install`, `langserver`, and `site.json`.

These are Figma Make workflow scripts, dependency/restart settings, and site metadata; they are not exported designs or application runtime components. The `dev` and deployment scripts invoke missing `dev`/`build` package scripts and reference a pnpm/Vite-era workflow. They do not participate in the validated Expo runtime/export path, but the Figma workflow itself is not operationally validated.

The authoritative Figma file, design owner, permissions, and continued use of Figma Make cannot be determined from these files. Decide whether to maintain or retire the integration before changing it.

## Repository Hygiene

- `.gitignore` excludes `node_modules/`, `.expo/`, `.idea/`, `dist/`, `build/`, caches, logs, `.tmp-*`, and `.env*`.
- Dependencies must be recreated from manifests/lockfile, not committed as `node_modules`.
- `.expo` contains machine state and generated Router types; regenerate locally and do not track it.
- `.idea` metadata is local. `.vscode/extensions.json` remains shared and recommends `openai.chatgpt`.
- `.env*` also ignores example templates; introduce a sanitized template/exception only after defining the actual variable contract.
- No `.easignore` exists; `.gitignore` controls EAS upload exclusions. Do not create an override without preserving required exclusions.
- No `/ios/` or `/android/` ignore rules were added. Native-project policy remains an engineering decision.
- Git LFS stores image assets. Generated raster images used at runtime are application assets, not disposable build output.
- The earlier cleanup staged four `.expo` and six `.idea` removals, preserving local metadata. Neither directory has tracked files in the current index.
- Existing documentation/asset deletions and application edits predate this documentation task; they were not discarded or restored.

The audit retained ignored `.tmp-handover-export/` and `.tmp-handover-introspect.json` plus generated caches. Documentation preparation adds `README.md`, `HANDOVER.md`, and `docs/API-SPECIFICATION.md`; no application files are modified or staged.

## Engineering Ownership

Assign owners and record decisions for:

- **Identity/backend:** authentication provider, API contracts, permissions, sessions, storage, retention, and migration.
- **Mobile/release:** iOS identifier, signing, Expo/Apple/Google access, development-client setup, native generation policy, update channels, runtime versioning, and rollback.
- **Product/safety/security:** what safety features actually guarantee, privacy behavior, emergency-number scope, location sharing, and production acceptance criteria.
- **Frontend/QA:** required source snapshot, lint/format/test policy, device matrix, responsive/accessibility acceptance, and known visual/runtime issues.
- **Design:** authoritative Figma source and whether Figma Make remains supported.
- **Operations:** environment contract, secret management, CI, external map/image services, and LFS availability.

Named engineering owners, production API endpoints, environment values, signing credentials, store readiness, and remote EAS channel mappings were not established from repository evidence. They must be supplied by the responsible team rather than inferred or silently chosen.

## 23 September handover package addendum

The earlier audit above is historical. Its previously untracked application changes are now committed in the current repository. The subsequent cleanup preserved source/configuration/dependencies and removed the old ignored export directories and validation log/introspection output. The API contract is now at docs/API-SPECIFICATION.md because the former file was already deleted in the working tree; links use the new canonical path. The sanitized .env.example is now explicitly allowed by .gitignore and contains comments only.

Use [current report](docs/HANDOVER-REPORT.md), [frontend handover](docs/FRONTEND-HANDOVER.md), [known issues](docs/KNOWN-ISSUES.md), and [acceptance checklist](docs/HANDOVER-CHECKLIST.md) for current cleanup/validation state. Historical references to remaining audit output, untracked source or the previous template policy do not describe the new state.
