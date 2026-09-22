import type { User } from '@/types';
import { MOCK_PLACES } from './mockData';

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Bongani Nombamba',
  handle: '@bonganinombamba',
  email: 'bongani.nombamba@email.com',
  phone: '+27 82 123 4567',
  avatar: 'B',
  profileImageUrl: require('@/imports/Bongz.png'),
  city: 'Cape Town',
  bio: 'Queer, proud, and always exploring. Finding joy in every corner of the city. 🏳️‍🌈✨',
  communities: ['Cape Town Queers', 'Trans South Africa', 'Queer POC Network', 'Pride Cape Town'],
  savedPlaces: [MOCK_PLACES[0], MOCK_PLACES[2], MOCK_PLACES[4]],
  verificationStatus: 'verified',
};
