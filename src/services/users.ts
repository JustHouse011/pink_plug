import { Platform } from 'react-native';
import { apiCall, apiList, apiListAll } from './api';
import type { AppNotification, Media, MediaKind, Paged, Place, SelfieVerification, TrustedContact, User, UserSettings } from '@/types';

/** Current user (E15-E25, E29-E31), trusted contacts (E52-E55) and notifications (E57-E59). */

export interface ProfilePatch {
  name?: string;
  handle?: string;
  city?: string;
  bio?: string;
  interests?: string[];
  profileImageId?: string | null;
  profileSetupComplete?: boolean;
}

/** E15 */
export function getMe(): Promise<User> {
  return apiCall<User>('/users/me');
}

/** E16 — email and phone changes are refused by the server until a re-verification flow exists. */
export function updateMe(patch: ProfilePatch): Promise<User> {
  return apiCall<User>('/users/me', { method: 'PATCH', body: patch });
}

/** E17 */
export function deactivateAccount(password: string): Promise<{ deactivated: true }> {
  return apiCall('/users/me/deactivate', { method: 'POST', body: { password }, idempotent: true });
}

/** E18 */
export function deleteAccount(password: string): Promise<void> {
  return apiCall<void>('/users/me', { method: 'DELETE', body: { password } });
}

/** E19 */
export function getSettings(): Promise<UserSettings> {
  return apiCall<UserSettings>('/users/me/settings');
}

/** E20 — twoFactorEnabled is always on and cannot be patched. */
export function updateSettings(patch: Partial<Omit<UserSettings, 'twoFactorEnabled'>>): Promise<UserSettings> {
  return apiCall<UserSettings>('/users/me/settings', { method: 'PATCH', body: patch });
}

/** E29 */
export function listSavedPlaces(): Promise<Place[]> {
  return apiListAll<Place>('/users/me/saved-places');
}

/** E30 */
export function savePlace(placeId: string): Promise<{ placeId: string; saved: true }> {
  return apiCall(`/users/me/saved-places/${encodeURIComponent(placeId)}`, { method: 'PUT' });
}

/** E31 */
export function unsavePlace(placeId: string): Promise<void> {
  return apiCall<void>(`/users/me/saved-places/${encodeURIComponent(placeId)}`, { method: 'DELETE' });
}

/**
 * E21 — upload a local image URI (from expo-image-picker). Native fetch accepts
 * {uri,name,type} file parts; web needs a real Blob.
 */
export async function uploadMedia(uri: string, kind: MediaKind, mimeType = 'image/jpeg'): Promise<Media> {
  const form = new FormData();
  form.append('kind', kind);
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    form.append('file', blob, 'upload.jpg');
  } else {
    form.append('file', { uri, name: 'upload.jpg', type: mimeType } as unknown as Blob);
  }
  return apiCall<Media>('/media/upload', { method: 'POST', formData: form, idempotent: true });
}

/** E24 */
export function submitSelfieVerification(mediaId: string): Promise<SelfieVerification> {
  return apiCall<SelfieVerification>('/users/me/selfie-verifications', { method: 'POST', body: { mediaId }, idempotent: true });
}

export type ContactInput = Omit<TrustedContact, 'id' | 'isVerified'>;

/** E52 */
export function listTrustedContacts(): Promise<TrustedContact[]> {
  return apiListAll<TrustedContact>('/trusted-contacts');
}

/** E53 — at most five contacts, unique by phone. */
export function addTrustedContact(input: Partial<ContactInput> & { name: string; phone: string }): Promise<TrustedContact> {
  return apiCall<TrustedContact>('/trusted-contacts', { method: 'POST', body: input, idempotent: true });
}

/** E54 */
export function updateTrustedContact(id: string, patch: Partial<ContactInput>): Promise<TrustedContact> {
  return apiCall<TrustedContact>(`/trusted-contacts/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch });
}

/** E55 */
export function removeTrustedContact(id: string): Promise<void> {
  return apiCall<void>(`/trusted-contacts/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/** E57 — meta.unreadCount counts every unread notification. */
export function listNotifications(params: { page?: number; limit?: number; unread?: boolean } = {}): Promise<Paged<AppNotification>> {
  return apiList<AppNotification>('/notifications', { query: params });
}

/** E58 */
export function markNotificationRead(id: string): Promise<AppNotification> {
  return apiCall<AppNotification>(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH', body: { read: true } });
}

/** E59 */
export function markAllNotificationsRead(): Promise<{ updatedCount: number }> {
  return apiCall('/notifications/read-all', { method: 'PATCH' });
}
