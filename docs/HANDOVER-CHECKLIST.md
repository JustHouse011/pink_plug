# Handover acceptance checklist

Checked items have evidence from this task; unchecked items require engineering/owner action. Export and static checks do not prove device behavior. See HANDOVER-REPORT.md for commands and limitations.

## Repository

- [ ] Final clean Git status after the owner reviews and commits the handover changes.
- [x] Demonstrably generated old exports/logs removed; uncertain source/assets retained and classified.
- [x] .gitignore verified; environment template exception and signing exclusions added.
- [x] Manifest/lockfile declarations match; installed top-level dependencies resolve.
- [ ] Resolve/accept Expo SVG compatibility mismatch and rerun compatibility checks.
- [x] No missing static imports or configured local assets; all-platform export succeeds.
- [x] Current-file secret scan completed with no likely embedded credentials found.
- [ ] Verify full history, remote artifacts, fixture provenance and any external secrets before publication.
- [ ] Owner confirms externally made deletions of the two old API documents and the new canonical path.

## Frontend

- [ ] Screens load correctly in interactive QA.
- [ ] Navigation and deep links work on target devices.
- [ ] Animations/splash/reduced-motion behavior verified.
- [x] Local asset references resolve and production assets export.
- [ ] Forms, errors, loading states, permission denial and offline behavior tested.
- [ ] Android installed application tested.
- [x] iOS requirements and platform differences documented.
- [ ] iOS installed application tested.
- [x] Application source and behavior preserved by cleanup; protected file hashes unchanged.

## Backend

- [x] Proposed API requirements documented: 71 endpoint contracts, no deployed-backend claim.
- [x] Authentication/session/provisioning gaps documented.
- [x] 25 data models with canonical field definitions indexed.
- [x] Existing media selection and proposed uploads documented.
- [x] All 22 route/layout files and significant feature components mapped.
- [x] 26 mock/local integration groups identified.
- [ ] Resolve 24 open engineering decision groups or record explicit conditional deferrals.
- [ ] Implement and test services, ownership/authorization, privacy and migrations.

## Expo

- [x] Project ID, local appVersion runtime policy and build profiles documented.
- [x] Configured development/preview channels documented, including production's preview assignment.
- [ ] Verify remote channel-to-branch mappings and actual built runtime versions.
- [x] Update process and manual release-mode update behavior documented.
- [ ] Decide release-channel separation.
- [ ] Configure iOS identity/signing and development client.
- [ ] Complete native builds, permissions, OTA and rollback validation.

## Handover

- [x] README and architecture/setup documentation prepared.
- [x] Comment-only environment template reflects actual absence of variable reads.
- [x] Known issues, security findings and backend integration points documented.
- [x] TypeScript, all-platform export and Metro startup readiness pass.
- [ ] Owner reviews documentation changes and assigns engineering owners.
- [ ] Final repository accepted by receiving engineering team.
