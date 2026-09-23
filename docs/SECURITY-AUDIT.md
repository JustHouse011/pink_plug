# Security audit

Date: 23 September 2026. Scope: current application/source/configuration, retained tooling and current Git index. This is a static handover review, not penetration testing, legal approval or production certification. Dependency vulnerability advisories, full Git history, remote secrets and cloud access were not audited.

## Credential scan

No likely embedded API keys, access/refresh credentials, private keys, signing files, credential-bearing URLs or database credentials were found in the inspected project files. No .env or generated/cache entries are tracked in the current index. A secret-pattern match in src/navigation/routes.ts near line 13 was the changePassword route path, not a password. Examples in API documentation use explicitly illustrative credentials. Expo owner/project UUID and Android package are public project identifiers, not secrets. Values are not reproduced here.

The scan used private-key headers, common provider token/JWT patterns, secret assignments, credential-bearing URLs and environment-file names. Pattern scanning cannot establish that every arbitrary string is safe. If an actual secret is discovered later: revoke/rotate it, remove it from source, assess history/artifact exposure and coordinate history cleanup with repository owners; ignoring a file does not remove historical exposure.

## Findings requiring production work

| Location | Finding | Required remediation |
| --- | --- | --- |
| src/services/mockOtpService.ts; app/login.tsx; app/register.tsx | Local random OTPs, demo disclosure, arbitrary six-digit login fallback | Replace with server verification, attempt/rate limits and purpose-bound challenges. |
| src/store/useAppStore.ts; app/index.tsx | Persisted boolean is treated as authentication; no validated session or secure token transport | Implement session bootstrap/revocation and server authorization; choose approved token storage. |
| src/store/useEmergencyContactsStore.ts | Personal contact data in unscoped AsyncStorage; logout does not clear it; empty saved lists revive demo defaults | User-scope and clear private caches, preserve empty results, define retention and consent; never auto-import fixtures. |
| src/data/mockUser.ts; contact defaults | Human names, portrait and plausible phone/email fixture values have unverified provenance | Owner must confirm consent/synthetic status before public redistribution; do not call fixtures or treat them as verified recipients. No personal values reproduced here. |
| app/settings.tsx; app/privacy-settings.tsx; app/manage-sessions.tsx | Simulated verification, privacy/security controls, session removal and deactivation | Enforce policy on server; replace timed success only after confirmed outcomes. |
| Route screens/maps/sharing | Fixed positions and sharing flags are not live telemetry or recipient consent | Explicitly approve location scope, recipients, expiry and precision before implementing hosted shares. |
| app/_layout.tsx | Manual OTA check/fetch/reload in release mode; console warning includes raw error | Review release targeting, redaction and reload timing; preserve diagnostics during this cleanup. |
| app.json / native introspection | RECORD_AUDIO permission and previously observed permissive iOS transport configuration | Validate least privilege and final native release configuration; no permission changes made here. |
| RouteMap.tsx | Native WebView loads remote Leaflet code/styles and tile resources | Review external supply chain, network failure behavior, navigation/message boundaries and attribution. |

## Privacy boundaries

Emergency contacts, phone/email, RSVP accessibility messages, verification images, sessions and precise location require owner-scoped access. Device permission is not consent from a contact or location-share recipient. Do not expose verification images through public URLs. Apply profile visibility to image delivery, and omit recipient lists from recipient location-share responses. Expired/revoked shares must not reveal coordinates. Backend/API security requirements are proposals, not protections implemented by the frontend today.

## Repository protections

.gitignore retains environment/cache exclusions and now excludes common signing material. Only the sanitized root .env.example is excepted from .env*. No .easignore was introduced; EAS fallback behavior is preserved. No source, permissions, token handling or application behavior was changed by this audit.
