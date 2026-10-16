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
  authorId?: string;
  createdAt?: string | null;
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
  authorId?: string;
  createdAt?: string | null;
  likedByMe?: boolean;
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
  /** Server-derived (buildUser/serializeUser in pink_plug_backend). Empty/false before profile setup completes. */
  interests: string[];
  profileSetupComplete: boolean;
}

/** M?? AuthChallenge — docs/API-SPECIFICATION.md. Returned by register/login/forgot-password/otp-resend. */
export interface AuthChallenge {
  challengeId: string;
  purpose: 'register' | 'login' | 'password_change' | 'password_reset';
  delivery: 'email';
  maskedDestination: string;
  expiresAt: string;
  resendAfter: string;
}

/** Session — docs/API-SPECIFICATION.md. One signed-in device/session for the current user. */
export interface Session {
  id: string;
  device: string;
  location: string;
  current: boolean;
  lastSeen: string;
  lastSeenAt: string;
}

/** POST /auth/verify-otp response. Exchange customToken with signInWithCustomToken client-side. */
export interface VerifyOtpResult {
  tokenType: 'firebase_custom_token';
  customToken: string;
  session: Session;
  user: User;
}

export interface DirectoryResource {
  id: string;
  name: string;
  category: string;
  city: string;
  area: string;
  description: string;
  detail: string;
  badge: string;
}

/** Pagination meta returned alongside list responses. */
export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  unreadCount?: number;
}

export interface Paged<T> {
  items: T[];
  meta: PageMeta;
}

export interface Option {
  value: string;
  label: string;
}

export interface PostComment {
  id: string;
  postId: string;
  author: string;
  text: string;
  authorId?: string;
  createdAt: string | null;
}

export interface Campaign {
  id: string;
  title: string;
  host: string;
  date: string;
  location: string;
  image: string;
  tags: string[];
  metrics: { label: string; value: string }[];
}

export type ParticipationRole = 'Couple Joining Mass Wedding' | 'Guest / Supporter' | 'Media / Press';

export interface AppNotification {
  id: string;
  title: string;
  detail: string;
  time: string;
  createdAt: string | null;
  read: boolean;
}

export interface UserSettings {
  pushNotifications: boolean;
  mutePushNotifications: boolean;
  pushNewEvent: boolean;
  pushCommunityReview: boolean;
  emailNotifications: boolean;
  muteEmailNotifications: boolean;
  emailNewEvent: boolean;
  emailCommunityReview: boolean;
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  profileVisible: boolean;
  shareLocation: boolean;
  showLocation: boolean;
  allowMessages: boolean;
  dataSharing: boolean;
}

export type MediaKind = 'profile_photo' | 'verification_selfie';

export interface Media {
  id: string;
  kind: MediaKind;
  mimeType: string;
  sizeBytes: number;
  url: string | null;
  width: number;
  height: number;
  createdAt: string | null;
}

export interface SelfieVerification {
  id: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string | null;
  completedAt: string | null;
}

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isVerified: boolean;
  canReceiveSms: boolean;
  canReceiveCall: boolean;
  shareLiveLocation: boolean;
}

export interface PlannedRoute {
  id: string;
  mode: TransitMode;
  placeIds: string[];
  selectedPlaceId: string | null;
  status: 'draft' | 'active' | 'ended';
  departureAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
}

export interface CheckIn {
  id: string;
  placeId: string;
  routeId?: string;
  createdAt: string | null;
  observedAt: string | null;
  status: string;
}
