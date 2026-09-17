import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type EmergencyContact = {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isVerified: boolean;
  canReceiveSms: boolean;
  canReceiveCall: boolean;
  shareLiveLocation: boolean;
};

interface EmergencyContactsState {
  contacts: EmergencyContact[];
  limit: number;
  addContact: (contact: Omit<EmergencyContact, 'id'> & { id?: string }) => void;
  updateContact: (id: string, updates: Partial<EmergencyContact>) => void;
  removeContact: (id: string) => void;
  setContacts: (contacts: EmergencyContact[]) => void;
}

const STORAGE_KEY = 'pink-plug-emergency-contacts';

const defaultContacts: EmergencyContact[] = [
  {
    id: 'demo-1',
    name: 'Aphiwe Ndlovu',
    phone: '+27821234567',
    relationship: 'Sibling',
    isVerified: true,
    canReceiveSms: true,
    canReceiveCall: true,
    shareLiveLocation: true,
  },
  {
    id: 'demo-2',
    name: 'Mpho Dlamini',
    phone: '+27717654321',
    relationship: 'Friend',
    isVerified: false,
    canReceiveSms: true,
    canReceiveCall: false,
    shareLiveLocation: false,
  },
];

export const useEmergencyContactsStore = create<EmergencyContactsState>((set) => ({
  contacts: defaultContacts,
  limit: 5,
  setContacts: (contacts) => set({ contacts }),
  addContact: (contact) =>
    set((state) => {
      if (state.contacts.length >= state.limit) return state;

      const nextContact: EmergencyContact = {
        id: contact.id ?? `contact-${Date.now()}`,
        name: contact.name,
        phone: contact.phone,
        relationship: contact.relationship || 'Friend',
        isVerified: contact.isVerified ?? false,
        canReceiveSms: contact.canReceiveSms ?? true,
        canReceiveCall: contact.canReceiveCall ?? false,
        shareLiveLocation: contact.shareLiveLocation ?? false,
      };

      return { contacts: [...state.contacts, nextContact] };
    }),
  updateContact: (id, updates) =>
    set((state) => ({
      contacts: state.contacts.map((contact) =>
        contact.id === id ? { ...contact, ...updates } : contact,
      ),
    })),
  removeContact: (id) =>
    set((state) => ({
      contacts: state.contacts.filter((contact) => contact.id !== id),
    })),
}));

AsyncStorage.getItem(STORAGE_KEY)
  .then((stored) => {
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as EmergencyContact[];
      if (Array.isArray(parsed) && parsed.length) {
        useEmergencyContactsStore.setState({ contacts: parsed });
      }
    } catch {
      // no-op
    }
  })
  .catch(() => undefined);

useEmergencyContactsStore.subscribe((state) => {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.contacts)).catch(() => undefined);
});
