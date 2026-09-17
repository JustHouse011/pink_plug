import type { ImageSourcePropType } from 'react-native';

export type VerificationType = 'queer_owned' | 'queer_friendly' | 'community_verified';
export type ResourceType = 'emergency' | 'legal' | 'crisis' | 'hate_crime';
export type TransitMode = 'walking' | 'driving' | 'transit';
export type PrivacyLevel = 'exact' | 'fuzzed_300m' | 'city_only';
export type Tab = 'home' | 'route' | 'explore' | 'community' | 'profile';
export type Screen =
  | 'onboarding'
  | 'home'
  | 'route'
  | 'explore'
  | 'community'
  | 'profile'
  | 'place-profile'
  | 'event-profile'
  | 'build-route'
  | 'safety'
  | 'directory'
  | 'travel';

export interface Coords {
  latitude: number;
  longitude: number;
}

export interface Review {
  id: string;
  user: string;
  avatar: string;
  rating: number;
  headline: string;
  comment: string;
  timeAgo: string;
}

export interface Place {
  id: string;
  name: string;
  city: string;
  category: 'stay' | 'eat' | 'drink' | 'party' | 'shop' | 'culture' | 'wellness' | 'services';
  address: string;
  distance: string;
  rating: number;
  reviewCount: number;
  verifications: VerificationType[];
  description: string;
  hours: string;
  imageUrl: string;
  coords: Coords;
  safetyScore: number;
  reviews: Review[];
}

export interface Event {
  id: string;
  title: string;
  type: 'pride' | 'party' | 'drag' | 'community' | 'workshop' | 'cultural';
  date: string;
  time: string;
  venue: string;
  address: string;
  price: string;
  attendees: number;
  imageUrl: string | ImageSourcePropType;
  organiser: string;
  descriptionHeading?: string;
  descriptionLead?: string;
  description: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  reviews: Review[];
}

export interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  handle: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  shares: number;
  timeAgo: string;
  city: string;
  tags: string[];
}

export interface SafetyResource {
  id: string;
  title: string;
  description: string;
  phoneContact?: string;
  websiteUrl?: string;
  resourceType: ResourceType;
}

export interface Waypoint {
  id: string;
  place: Place;
  order: number;
}

export interface User {
  id: string;
  name: string;
  handle: string;
  email: string;
  phone: string;
  avatar: string;
  profileImageUrl?: string | ImageSourcePropType;
  city: string;
  bio: string;
  communities: string[];
  savedPlaces: Place[];
  verificationStatus: 'verified' | 'pending' | 'unverified';
}
