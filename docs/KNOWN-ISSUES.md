# Known issues and release gates

This is a frontend-to-backend handover, not production certification. No issue below was hidden by changing UI or behavior.

| Area | Issue / next action |
| --- | --- |
| Dependencies | Expo Doctor passes 20/21 checks; react-native-svg 15.15.5 differs from SDK expectation 15.15.4. Review/pin and revalidate in a dedicated dependency change. |
| Authentication | Mock OTP disclosure/bypass, no server sessions, no secure token storage, simulated providers/biometrics. |
| Registration/recovery | Initial password provisioning missing; forgot-password route expects current password. |
| Data | Bundled catalogues/user/feed, ephemeral comments/actions, hard-coded stats, timed RSVP and verification; 26 integration groups documented. |
| Privacy/contacts | Non-user-scoped storage, contacts survive logout, empty contact lists repopulate defaults, demo personal-data provenance unverified. |
| Routing/location | Fixed origin, heuristic metrics and flags do not establish live location or navigation guarantees. Hosted sharing/consent/expiry are conditional. |
| Safety | SOS opens a dialer; no monitored dispatch. Curate emergency resources and approve regional scope. |
| Media | No uploads, MIME/size validation or real selfie verification; choose provider/limits/privacy. |
| iOS | Bundle identifier absent; macOS/Xcode/signing and physical-device validation required. |
| Development builds | expo-dev-client absent despite developmentClient profile. |
| Updates | Production currently uses preview channel; remote branch mapping and actual built runtime unverified. |
| Native permissions | Review RECORD_AUDIO and final transport/contacts/camera/photo policies; test denial/recovery. |
| External resources | Map scripts/tiles, external images and share URL destinations require ownership, availability and privacy QA. |
| Tooling | No lint/test script or automated suite; earlier formatter check found 72 files. No broad formatting done. |
| Legacy files | Retained Figma scripts expect absent dev/build scripts; Vite typing/include and unused source/assets need owner review. |
| QA | Startup/export do not establish rendered screens, interaction, accessibility, animation, navigation, Android/iOS installation or OTA correctness. |

Before public distribution, review fixture portrait/contact licensing/consent without reproducing personal values in docs. Backend provider credentials, production URLs, signing access and remote EAS access must come from authorized owners, not guessed configuration. Record approved deferrals for conditional features rather than marking them implemented.
