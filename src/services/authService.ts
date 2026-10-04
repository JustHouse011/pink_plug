import { signInWithCustomToken, signOut } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebaseClient';
import { apiCall } from './api';
import type { AuthChallenge, Session, User, VerifyOtpResult } from '@/types';

/**
 * Real implementation of the two-step auth flow in pink_plug_backend/README.md
 * ("How authentication works") and docs/API-SPECIFICATION.md section 6 (E01-E14).
 * Replaces src/services/mockOtpService.ts, which this module supersedes.
 */

export interface RegisterInput {
  name: string;
  surname: string;
  email: string;
  phone: string;
  password: string;
}

/** E01 — create a pending account and email a verification code. */
export function register(input: RegisterInput): Promise<AuthChallenge> {
  return apiCall<AuthChallenge>('/auth/register', { method: 'POST', body: input, auth: 'none', idempotent: true });
}

/** E02 — verify the password, then email a sign-in code. No tokens are issued until the code is verified. */
export function login(email: string, password: string): Promise<AuthChallenge> {
  return apiCall<AuthChallenge>('/auth/login', { method: 'POST', body: { email, password }, auth: 'none', idempotent: true });
}

/**
 * E03 — consumes a register/login code, starts a session, and exchanges the
 * returned Firebase custom token for a real signed-in session via the client SDK.
 */
export async function verifyOtp(challengeId: string, otp: string): Promise<{ user: User; session: Session }> {
  const result = await apiCall<VerifyOtpResult>('/auth/verify-otp', {
    method: 'POST',
    body: { challengeId, otp },
    auth: 'none',
    idempotent: true,
  });
  await signInWithCustomToken(firebaseAuth, result.customToken);
  return { user: result.user, session: result.session };
}

/** E04 — resend the code for an existing challenge. */
export function resendOtp(challengeId: string): Promise<AuthChallenge> {
  return apiCall<AuthChallenge>('/auth/otp/resend', { method: 'POST', body: { challengeId }, auth: 'optional', idempotent: true });
}

/** E06 — revoke the current session, then sign out of Firebase locally. Best-effort: always signs out locally even if the network call fails. */
export async function logout(): Promise<void> {
  try {
    await apiCall<void>('/auth/logout', { method: 'POST' });
  } catch {
    // Still sign out locally — the session may already be invalid, or the network may be down.
  } finally {
    await signOut(firebaseAuth).catch(() => undefined);
  }
}

/** E07 — validates the bootstrap session and returns the current user/session (used on app start). */
export function getSession(): Promise<{ user: User; session: Session }> {
  return apiCall('/auth/session');
}

/** E08 — list active sessions for the signed-in user. */
export async function listSessions(): Promise<Session[]> {
  return apiCall<Session[]>('/auth/sessions');
}

/** E09 — revoke one owned session (not necessarily the current one). */
export function revokeSession(sessionId: string): Promise<void> {
  return apiCall<void>(`/auth/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' });
}

/** E10 — sign out everywhere, including this session. Caller should also clear local state/navigate. */
export async function revokeAllSessions(): Promise<void> {
  await apiCall<void>('/auth/sessions', { method: 'DELETE' });
  await signOut(firebaseAuth).catch(() => undefined);
}

/** E11 — verify the current password and email a password-change code. */
export function changePasswordChallenge(currentPassword: string): Promise<AuthChallenge> {
  return apiCall<AuthChallenge>('/auth/change-password/challenge', { method: 'POST', body: { currentPassword }, idempotent: true });
}

/** E12 — verify the code, set the new password, and revoke every session (including this one). */
export function changePassword(challengeId: string, otp: string, newPassword: string): Promise<{ changed: true }> {
  return apiCall('/auth/change-password', { method: 'POST', body: { challengeId, otp, newPassword }, idempotent: true });
}

/** E13 — start enumeration-resistant password recovery. */
export function forgotPassword(email: string): Promise<AuthChallenge> {
  return apiCall<AuthChallenge>('/auth/forgot-password', { method: 'POST', body: { email }, auth: 'none', idempotent: true });
}

/** E14 — complete recovery and revoke every session. */
export function resetPassword(challengeId: string, otp: string, newPassword: string): Promise<{ changed: true }> {
  return apiCall('/auth/reset-password', { method: 'POST', body: { challengeId, otp, newPassword }, auth: 'none', idempotent: true });
}
