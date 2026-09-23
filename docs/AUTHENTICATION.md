# Authentication handover

## EXISTING FRONTEND IMPLEMENTATION

app/index.tsx waits for hydration then redirects using a local isAuthenticated boolean. Login/register/change-password use mockOtpService.ts: Math.random codes and in-memory checks, without delivery. Login accepts an arbitrary six-digit OTP after code generation. Demo codes appear in UI/alerts. Passwords are not authenticated by a server; provider/biometric sign-in is simulated.

useAppStore persists auth/onboarding/sharing/route/review state under pink-plug-store. Logout clears that store but not the separate emergency-contact store. Entry redirects are not authorization boundaries; no complete production protected-route/session enforcement exists. Session management uses static rows. No token acquisition, vault, refresh lifecycle or backend role model exists.

Registration has no password field; login requires a password. Forgot-password leads to a current-password form. Initial provisioning and recovery need coordinated frontend/backend decisions.

## PROPOSED BACKEND REQUIREMENTS

[API specification](API-SPECIFICATION.md) contracts E01-E14 define register/login, OTP verification/resend, refresh, logout, session lookup/list/revocation, password change and planned recovery. Password-change resend requires the original authenticated session. Server challenges need expiry, attempt/resend limits and enumeration resistance; never return demo OTPs to production clients.

Server authorization derives owner identity from validated sessions. Define access expiry, refresh rotation/reuse detection, concurrent retries, revocation and account-switch cache clearing. Bootstrap from a validated session, not a boolean. Mobile secure storage and web cookie/CSRF transport remain explicit decisions; AsyncStorage is not the token vault. No role hierarchy is implied by current screens.

Decide provisioning/recovery, verified provider exchange, biometric unlock and two-factor enrollment before enabling related controls. Reauthenticate sensitive security/deactivation actions and specify which sessions survive password changes. Test deep links, expiry, refresh failure, offline restoration, revoked sessions, logout and switching accounts. These services are proposed, not implemented in this task.
