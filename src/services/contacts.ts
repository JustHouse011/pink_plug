import * as Contacts from 'expo-contacts';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export type NativeContactSelection = {
  id?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber: string;
  relationship?: string;
  avatarUri?: string | null;
};

export function normalizePhoneNumber(raw: string): string {
  const normalized = raw.replace(/[^\d+]/g, '');
  if (!normalized) return '';

  const parsed = parsePhoneNumberFromString(normalized);
  if (parsed && parsed.isValid()) {
    return parsed.format('E.164');
  }

  return normalized.startsWith('+') ? normalized : `+${normalized.replace(/^0+/, '')}`;
}

export async function requestContactPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
  const { status } = await Contacts.requestPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export async function pickContactFromPhoneBook(): Promise<NativeContactSelection | null> {
  const permission = await requestContactPermission();
  if (permission !== 'granted') return null;

  try {
    const result = await Contacts.presentContactPickerAsync();
    if (!result) return null;

    const primaryNumber = result.phoneNumbers?.[0]?.number;
    if (!primaryNumber) return null;

    const normalized = normalizePhoneNumber(primaryNumber);
    if (!normalized) return null;

    return {
      id: result.id ?? undefined,
      firstName: result.firstName ?? '',
      lastName: result.lastName ?? '',
      phoneNumber: normalized,
      relationship: 'Trusted contact',
      avatarUri: result.imageAvailable ? result.image?.uri ?? null : null,
    };
  } catch {
    return null;
  }
}
