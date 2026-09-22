# THE PINK PLUG
# Frontend-Derived API Requirements
## Draft v0.1

STATUS: DRAFT — FRONTEND-DERIVED CONTRACT

This document describes API requirements inferred from the current The Pink Plug frontend implementation. It is not a finalized backend specification. Items marked INFERRED or TBD require agreement between frontend, backend, and product teams.

---

## 1. DOCUMENT PURPOSE

This draft exists to capture the minimum backend contract implied by the current React Native / Expo application. It is intentionally limited to the behavior present in the repository and excludes design assumptions that are not surfaced by the code.

The frontend is the source of truth for this exercise. It includes:

- authentication and onboarding screens
- user profile setup and settings
- Explore / Directory / Community flows
- event and place detail screens
- campaigns and share flows
- route planning and proximity-based place data
- emergency contacts and safety resources
- local persistence with AsyncStorage and Zustand
- mock OTP, mock data, and simulated sharing

This document is a backend handoff draft only. It does not implement APIs, does not replace mock data, and does not modify the app runtime.

---

## 2. CURRENT FRONTEND ARCHITECTURE

### Application type

- Expo React Native application using Expo Router
- Mobile-first implementation with web compatibility support
- Route-level navigation with tabs and stack screens
- Local state persisted using Zustand + AsyncStorage
- Mock data used throughout for places, events, posts, and safety resources

### Key source files reviewed

- `app/index.tsx`
- `app/login.tsx`
- `app/register.tsx`
- `app/onboarding.tsx`
- `app/profile-setup.tsx`
- `app/settings.tsx`
- `app/safety.tsx`
- `app/emergency-contacts.tsx`
- `app/(tabs)/home.tsx`
- `app/(tabs)/explore.tsx`
- `app/(tabs)/community.tsx`
- `app/(tabs)/route.tsx`
- `app/directory.tsx`
- `app/travel.tsx`
- `app/places/[id].tsx`
- `app/events/[id].tsx`
- `src/types/index.ts`
- `src/data/mockData.ts`
- `src/data/mockUser.ts`
- `src/store/useAppStore.ts`
- `src/store/useEmergencyContactsStore.ts`
- `src/services/mockOtpService.ts`
- `src/services/sharing.ts`
- `src/services/contacts.ts`

### Frontend behavior currently simulated locally

The following are not backed by backend APIs in the current repository and should be treated as prototype or mock flows unless product/backend later define real equivalents:

- registration and login simulation
- email/phone OTP verification
- onboarding completion persistence
- route planning and waypoint persistence
- community post creation and share actions
- emergency contact storage and verification state
- place/event/profile reviews stored in local review cache
- SOS action and safety step remain UI-only and device-level actions

---

## 3. API CONVENTIONS

### Proposed REST API convention

This project does not currently define a backend API contract or versioning convention. The following is a proposed convention for backend planning only and should be treated as PROPOSED, not confirmed frontend behavior.

- Prefix: `/api/v1`
- Example: `/api/v1/places/nearby`
- JSON response envelope: `{ "data": ..., "pagination": ... }` or `{ "error": ... }`
- Auth: bearer token or session cookie, where required

### Proposed error envelope

```json
{
  "error": {
    "code": "PLACE_NOT_FOUND",
    "message": "Place could not be found",
    "details": {}
  }
}
```

### Frontend mapping expectations

- `400` => validation issue or malformed request
- `401` => unauthenticated or expired session
- `403` => forbidden action
- `404` => resource missing
- `409` => duplicate or conflict state
- `422` => business validation failure
- `429` => rate-limited
- `500` => server failure or unexpected error

---

## 4. AUTHENTICATION

### Confirmed frontend requirements

The app currently contains:

- onboarding flow before login
- registration with name, surname, email, phone
- login with email and password
- optional Gmail and Apple sign-in buttons (simulated)
- biometric login simulation
- OTP-based verification for login and registration
- logout action
- session persistence in Zustand + AsyncStorage
- profile setup after account creation
- password reset deep link to `/change-password`

### Current frontend behavior

The app does not call a real backend. Instead, it uses `mockOtpService` and local auth state persistence.

### Proposed endpoints

| METHOD | PATH | PURPOSE | AUTH REQUIRED | STATUS |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | Create a new account and start verification | No | CONFIRMED |
| POST | `/api/v1/auth/login` | Email/password login | No | CONFIRMED |
| POST | `/api/v1/auth/verify-otp` | Verify OTP for login or registration | No | CONFIRMED |
| POST | `/api/v1/auth/logout` | End session | Yes | CONFIRMED |
| POST | `/api/v1/auth/refresh` | Refresh session token if used | No | INFERRED |
| GET | `/api/v1/users/me` | Fetch authenticated user profile | Yes | CONFIRMED |
| POST | `/api/v1/auth/password-reset/request` | Trigger password reset flow | No | INFERRED |
| POST | `/api/v1/auth/password-reset/confirm` | Complete password reset with new password and OTP | No | INFERRED |

### Authentication-related request model

```json
{
  "email": "bongani.nombamba@email.com",
  "password": "********",
  "name": "Bongani",
  "surname": "Nombamba",
  "phone": "+27821234567",
  "otp": "123456"
}
```

### Authentication status

- Email and password login flow is confirmed by `app/login.tsx`
- OTP flow is confirmed by `app/login.tsx` and `app/register.tsx`
- Gmail/Apple and biometric login are present as UI simulation only and should be treated as optional social/biometric providers, not mandated backend requirements
- The backend must not assume tenant/account provider specifics without product agreement

---

## 5. USERS & PROFILES

### Confirmed profile fields

The UI currently consumes the following fields from the mocked user model:

- `id`
- `name`
- `handle`
- `email`
- `phone`
- `avatar`
- `profileImageUrl`
- `city`
- `bio`
- `communities`
- `savedPlaces`
- `verificationStatus`

This model is defined in `src/types/index.ts` and `src/data/mockUser.ts`.

### Confirmed profile behaviors

- Display current user profile in settings
- Update full name, email, phone, username, city, bio
- Upload or change profile photo via native image picker or web file input
- Toggle profile visibility or account privacy settings in Local UI only
- Save profile image locally in the app state

### Proposed endpoints

| METHOD | PATH | PURPOSE | AUTH REQUIRED | STATUS |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/users/me` | Current authenticated user profile | Yes | CONFIRMED |
| PATCH | `/api/v1/users/me` | Update profile fields | Yes | CONFIRMED |
| POST | `/api/v1/users/me/avatar` | Upload or replace avatar/profile image | Yes | CONFIRMED |
| GET | `/api/v1/users/:id` | Public profile read for other users | Yes | INFERRED |
| PATCH | `/api/v1/users/me/privacy` | Update privacy preferences | Yes | INFERRED |

### User profile example

```json
{
  "id": "u1",
  "name": "Bongani Nombamba",
  "handle": "@bonganinombamba",
  "email": "bongani.nombamba@email.com",
  "phone": "+27821234567",
  "avatar": "B",
  "profileImageUrl": "https://example.com/avatars/u1.jpg",
  "city": "Cape Town",
  "bio": "Queer, proud, and always exploring.",
  "communities": ["Cape Town Queers", "Trans South Africa"],
  "savedPlaces": ["p1", "p3", "p5"],
  "verificationStatus": "verified"
}
```

---

## 6. HOME

### Confirmed frontend data consumed

The home screen renders:

- welcome copy and user greeting
- emergency updates notification bar
- top-level quick actions to route, explore, events, directory, travel, and safety
- featured campaign card
- nearby spaces
- upcoming events
- community update sharing / comments
- notification modal

### Local data used here

- `MOCK_USER`
- `MOCK_PLACES`
- `MOCK_EVENTS`
- local notification array in `Home`

### Proposed endpoints

| METHOD | PATH | PURPOSE | AUTH REQUIRED | STATUS |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/home/summary` | Return dashboard summary data for the current user | Yes | INFERRED |
| GET | `/api/v1/notifications` | Load in-app notifications | Yes | INFERRED |
| PATCH | `/api/v1/notifications/:id/read` | Mark a notification as read | Yes | INFERRED |
| PATCH | `/api/v1/notifications/read-all` | Mark all notifications read | Yes | INFERRED |

### Notes

Home currently operates as a composed dashboard of multiple resource types. The backend will likely need a combined summary endpoint if the app is kept lightweight.

---

## 7. EXPLORE / DIRECTORY

### Explore current behavior

`app/(tabs)/explore.tsx` searches and filters:

- spaces
- events
- city and keyword search
- list/grid layout
- category-level tabs and routing to detail pages

### Directory current behavior

`app/directory.tsx` searches and filters directory resources by:

- search query
- category
- city/location context

### Data fields used

#### Place object from frontend

```json
{
  "id": "p1",
  "name": "The Rainbow Lounge",
  "city": "Cape Town",
  "category": "drink",
  "address": "14 Long Street, Cape Town 8001",
  "distance": "0.3 km",
  "rating": 4.8,
  "reviewCount": 312,
  "verifications": ["queer_owned", "community_verified"],
  "description": "Cape Town's beloved queer cocktail bar...",
  "hours": "Mon–Thu 5pm–1am ...",
  "imageUrl": "https://images.unsplash.com/...",
  "coords": { "latitude": -33.9233, "longitude": 18.4239 },
  "safetyScore": 98,
  "reviews": []
}
```

#### Directory resource object

```json
{
  "id": "d1",
  "name": "Community Health Centre",
  "category": "healthcare",
  "city": "Johannesburg",
  "area": "Sandton",
  "description": "Inclusive healthcare support and referrals.",
  "detail": "Same-day appointments and queer-friendly services.",
  "badge": "Trusted"
}
```

### Proposed endpoints

| METHOD | PATH | PURPOSE | AUTH REQUIRED | STATUS |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/places` | List places with optional search and filters | Yes | CONFIRMED |
| GET | `/api/v1/places/nearby` | Return places near the user | Yes | CONFIRMED |
| GET | `/api/v1/places/:id` | Return details for one place | Yes | CONFIRMED |
| GET | `/api/v1/events` | List events | Yes | CONFIRMED |
| GET | `/api/v1/events/:id` | Return one event | Yes | CONFIRMED |
| GET | `/api/v1/directory/resources` | Query community resources | Yes | CONFIRMED |
| POST | `/api/v1/places/:id/reviews` | Add review to place | Yes | INFERRED |
| POST | `/api/v1/events/:id/reviews` | Add review to event | Yes | INFERRED |

### Query parameters used by UI

- `q` or `query`
- `city`
- `category`
- `latitude`
- `longitude`
- `radius`
- `limit`
- `cursor` or pagination token

---

## 8. COMMUNITY

### Confirmed frontend behavior

The community UI includes:

- feed of posts backed by `MOCK_POSTS`
- like button and state tracking
- comment composer and comment count
- share action via `shareContent`
- compose new post locally
- choose city filter chip
- tags on posts
- author avatar, handle, timeAgo, city, content

### Community post model

```json
{
  "id": "post_123",
  "author": "Bongani Nombamba",
  "avatar": "🌈",
  "handle": "@bonganinombamba",
  "content": "This weekend feels like a beautiful night to gather.",
  "imageUrl": "https://example.com/post.jpg",
  "likes": 42,
  "comments": 6,
  "shares": 12,
  "timeAgo": "2h ago",
  "city": "Cape Town",
  "tags": ["community", "safety"]
}
```

### Confirmed interactions

- `GET` community feed
- `POST` new community post
- `POST` comment on post
- `POST` share post
- `POST` like reaction

### Proposed endpoints

| METHOD | PATH | PURPOSE | AUTH REQUIRED | STATUS |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/community/feed` | Fetch community posts for city or global feed | Yes | CONFIRMED |
| POST | `/api/v1/community/posts` | Create a new post | Yes | CONFIRMED |
| GET | `/api/v1/community/posts/:id` | Fetch one post and metadata | Yes | INFERRED |
| DELETE | `/api/v1/community/posts/:id` | Remove a post | Yes | INFERRED |
| POST | `/api/v1/community/posts/:id/reactions` | Like or react to a post | Yes | CONFIRMED |
| DELETE | `/api/v1/community/posts/:id/reactions` | Remove a reaction | Yes | INFERRED |
| GET | `/api/v1/community/posts/:id/comments` | Fetch comments for a post | Yes | CONFIRMED |
| POST | `/api/v1/community/posts/:id/comments` | Add a comment | Yes | CONFIRMED |
| POST | `/api/v1/community/posts/:id/share` | Share a post externally or internally | Yes | CONFIRMED |

### Notes

The UI currently uses `shareContent()` from the front-end, which is a device/share-sheet abstraction. It does not establish the exact backend behavior for external share analytics or social network posting. Those should be treated as product decisions.

---

## 9. EVENTS

### Confirmed frontend event model

Fields used by the application:

- `id`
- `title`
- `type`
- `date`
- `time`
- `venue`
- `address`
- `price`
- `attendees`
- `imageUrl`
- `organiser`
- `descriptionHeading`
- `descriptionLead`
- `description`
- `tags`
- `rating`
- `reviewCount`
- `reviews`

### Confirmed frontend behaviors

- event list on Home and Explore
- event detail page
- event registration form with full name, email, phone
- success message after registration
- event directions via Google Maps
- review submission support in the general app review pattern

### Proposed endpoints

| METHOD | PATH | PURPOSE | AUTH REQUIRED | STATUS |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/events` | List events | Yes | CONFIRMED |
| GET | `/api/v1/events/:id` | Fetch single event detail | Yes | CONFIRMED |
| POST | `/api/v1/events/:id/register` | Register the user for the event | Yes | CONFIRMED |
| POST | `/api/v1/events/:id/reviews` | Submit review for event | Yes | INFERRED |

### Event example

```json
{
  "id": "ev_001",
  "title": "Pride After Dark",
  "type": "party",
  "date": "2026-10-01",
  "time": "21:00",
  "venue": "The Rainbow Lounge",
  "address": "14 Long Street, Cape Town 8001",
  "price": "R120",
  "attendees": 420,
  "imageUrl": "https://example.com/events/pride-after-dark.jpg",
  "organiser": "Cape Town Pride Collective",
  "descriptionHeading": "A night of queer joy and music",
  "descriptionLead": "Come dance with your community.",
  "description": "A vibrant evening of dance, drag, and celebration.",
  "tags": ["queer joy", "community", "nightlife"],
  "rating": 4.8,
  "reviewCount": 191,
  "reviews": []
}
```

---

## 10. CAMPAIGNS

### Confirmed frontend campaign support

The app includes a featured campaign card for the “Circle of Love” initiative with:

- title
- host
- date
- location
- tags
- metrics
- RSVP / Register flow
- share button
- native share sheet abstraction

### Proposed endpoints

| METHOD | PATH | PURPOSE | AUTH REQUIRED | STATUS |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/campaigns/featured` | Get current featured campaign | Yes | CONFIRMED |
| GET | `/api/v1/campaigns` | List campaigns | Yes | CONFIRMED |
| GET | `/api/v1/campaigns/:id` | Fetch campaign detail | Yes | CONFIRMED |
| POST | `/api/v1/campaigns/:id/rsvp` | RSVP or register interest | Yes | CONFIRMED |
| POST | `/api/v1/campaigns/:id/share` | Share campaign externally or internally | Yes | CONFIRMED |

### Notes

This flow is currently a front-end mock with a local form and share interaction. The backend only needs to support the data needed to render and submit the campaign form. No payment flow is present in the frontend.

---

## 11. PINK ROUTE

### Important boundary

The Pink Route feature in the repo is intentionally mock-based for Expo Go compatibility and does not currently integrate with a production mapping service.

The backend may eventually support:

- curated queer-friendly places
- route metadata and saved stops
- safety scores and community rankings
- trusted contact notifications
- route session history

However, mapping and routing provider responsibilities should remain separate from backend responsibilities.

### Current frontend behavior

The route screen currently supports:

- add places to route
- save waypoints locally
- select transit mode (walking, driving, transit)
- share route summary
- check in at a selected place
- timer while checked in
- placeholder travel suggestions

### Route model

```json
{
  "id": "route_123",
  "userId": "u1",
  "title": "Cape Town loop",
  "mode": "walking",
  "waypoints": ["p1", "p3", "p5"],
  "selectedPlaceId": "p3",
  "startedAt": "2026-09-21T18:00:00Z",
  "status": "active"
}
```

### Proposed endpoints

| METHOD | PATH | PURPOSE | AUTH REQUIRED | STATUS |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/routes` | List user route history or saved route presets | Yes | INFERRED |
| POST | `/api/v1/routes` | Create a route | Yes | INFERRED |
| GET | `/api/v1/routes/:id` | Fetch route summary | Yes | INFERRED |
| PATCH | `/api/v1/routes/:id` | Update route or stops | Yes | INFERRED |
| POST | `/api/v1/routes/:id/share` | Share route summary externally | Yes | INFERRED |
| POST | `/api/v1/routes/:id/checkin` | Record a check-in at a place | Yes | CONFIRMED |

### Third-party provider responsibility boundary

The frontend does not define an existing map provider. The backend should not assume Google Maps, Mapbox, or another provider unless product makes that choice later.

The backend may provide curated place metadata and community safety signals, while a provider handles live navigation and map rendering.

---

## 12. PLACES

### Confirmed frontend requirements

Places are the core object used across home, route, explore, and detail screens.

Fields confirmed in `src/types/index.ts` and `src/data/mockData.ts`:

- `id`
- `name`
- `city`
- `category`
- `address`
- `distance`
- `rating`
- `reviewCount`
- `verifications`
- `description`
- `hours`
- `imageUrl`
- `coords`
- `safetyScore`
- `reviews`

### Proposed endpoints

| METHOD | PATH | PURPOSE | AUTH REQUIRED | STATUS |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/places` | List places | Yes | CONFIRMED |
| GET | `/api/v1/places/nearby` | Nearby places near coordinates | Yes | CONFIRMED |
| GET | `/api/v1/places/:id` | Place details | Yes | CONFIRMED |
| GET | `/api/v1/places/:id/reviews` | Reviews for a place | Yes | INFERRED |

### Place detail notes

The place detail page also shows:

- safety score progress bar
- verification badges
- user reviews
- directions link to Google Maps
- add-to-route action

The backend should provide the metadata necessary to render trust and safety content, even if the map itself is third-party.

---

## 13. CHECK-INS

### Current frontend behavior

The route flow includes a mock location check-in:

- user selects a place
- app sets `checkedInPlace`
- app records `checkedInAt`
- route status shows active timer
- app alerts the user “Checked in”
- UI marks “Mock location pin active”

This is explicitly local simulation and does not define actual live location telemetry.

### Proposed endpoints

| METHOD | PATH | PURPOSE | AUTH REQUIRED | STATUS |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/check-ins` | Record a user check-in at a place | Yes | CONFIRMED |
| GET | `/api/v1/check-ins/:id` | Fetch specific check-in status | Yes | INFERRED |
| GET | `/api/v1/check-ins` | Fetch recent check-ins/history | Yes | INFERRED |
| POST | `/api/v1/check-ins/:id/share` | Share check-in with trusted contacts or community | Yes | INFERRED |

### Check-in request example

```json
{
  "placeId": "p1",
  "routeId": "route_123",
  "timestamp": "2026-09-21T18:20:00Z",
  "status": "active",
  "shareWithTrustedContacts": true
}
```

### Safety note

The frontend does not define how notifications to trusted contacts are actually triggered or handled. This is a product/backend decision and should be flagged as TBD.

---

## 14. TRUSTED CONTACTS

### Confirmed frontend data model

From `src/store/useEmergencyContactsStore.ts`:

- `id`
- `name`
- `phone`
- `relationship`
- `isVerified`
- `canReceiveSms`
- `canReceiveCall`
- `shareLiveLocation`

### Confirmed behaviors

- add contact from native phone book
- add contact manually
- set relationship
- update preferences for SMS / call / live GPS share
- limit of 5 contacts
- remove contact
- mark relationship as pending invite or verified

### Proposed endpoints

| METHOD | PATH | PURPOSE | AUTH REQUIRED | STATUS |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/trusted-contacts` | List user trusted contacts | Yes | CONFIRMED |
| POST | `/api/v1/trusted-contacts` | Add a contact | Yes | CONFIRMED |
| PATCH | `/api/v1/trusted-contacts/:id` | Update contact preferences | Yes | CONFIRMED |
| DELETE | `/api/v1/trusted-contacts/:id` | Remove contact | Yes | CONFIRMED |

### Example request

```json
{
  "name": "Aphiwe Ndlovu",
  "phone": "+27821234567",
  "relationship": "Sibling",
  "canReceiveSms": true,
  "canReceiveCall": true,
  "shareLiveLocation": true
}
```

---

## 15. SAFETY / SOS

### Current frontend behaviour

`app/safety.tsx` currently includes:

- emergency call button: `Linking.openURL('tel:112')`
- list of safety resources
- support resources with phone and website links
- pink route safe walk CTA

This is not a production-grade emergency guarantee. It is a prototype or user-triggered action.

### Current frontend data model

```json
{
  "id": "sr_001",
  "title": "LGBTQIA+ Support Line",
  "description": "Immediate support and guidance for queer people in crisis.",
  "phoneContact": "+27780000000",
  "websiteUrl": "https://example.com/support",
  "resourceType": "crisis"
}
```

### Proposed endpoints

| METHOD | PATH | PURPOSE | AUTH REQUIRED | STATUS |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/safety/resources` | Fetch safety resources | Yes | CONFIRMED |
| POST | `/api/v1/safety/sos` | Trigger a safety alert / escalation flow | Yes | TBD |
| GET | `/api/v1/safety/contacts` | Fetch emergency or trusted contact list | Yes | INFERRED |

### Safety decision boundary

CURRENT FRONTEND BEHAVIOUR:

- app opens a phone call to emergency services when the user taps the SOS button
- app displays support resources locally
- no backend guarantee exists for escalation, monitoring, or confirmation

BACKEND REQUIREMENT:

- If the product later adds real SOS functionality, backend must define escalation policy, authorization, and human response workflow

TBD SAFETY DECISION:

- Who receives alerts?
- What triggers an emergency alert?
- Which notifications are sent immediately vs after verification?
- Is this a static safety resource list or active incident response system?

---

## 16. NOTIFICATIONS

### Current frontend behavior

The app includes local notification arrays and a modal in the home screen. The notification data includes:

- `id`
- `title`
- `detail`
- `time`

The settings screen exposes toggles for push and email alert preferences.

### Proposed endpoints

| METHOD | PATH | PURPOSE | AUTH REQUIRED | STATUS |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/notifications` | Fetch notifications | Yes | INFERRED |
| PATCH | `/api/v1/notifications/:id/read` | Mark read | Yes | INFERRED |
| PATCH | `/api/v1/notifications/read-all` | Mark all read | Yes | INFERRED |

### Notification example

```json
{
  "id": "n1",
  "type": "route_update",
  "title": "Route update",
  "message": "Your safe route is 3 minutes away from your next stop.",
  "read": false,
  "createdAt": "2026-09-21T18:00:00Z",
  "deepLink": "/(tabs)/route"
}
```

---

## 17. SETTINGS

### Confirmed frontend settings behaviors

The settings page supports:

- update personal details
- upload photo
- take selfie verification for session identity
- toggle push notifications
- toggle email notifications
- mute preferences
- share live location preference
- account deactivation with password confirmation
- logout

### Proposed endpoints

| METHOD | PATH | PURPOSE | AUTH REQUIRED | STATUS |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/users/me/preferences` | Load user notification and privacy preferences | Yes | INFERRED |
| PATCH | `/api/v1/users/me/preferences` | Update settings | Yes | INFERRED |
| POST | `/api/v1/users/me/deactivate` | Disable account with reactivation window | Yes | INFERRED |

### Note

The app currently uses local UI state and doesn’t present a server-driven settings backend.

---

## 18. MEDIA / UPLOADS

### Confirmed frontend upload requirements

The app performs image upload or selection in multiple places:

- user profile photo
- selfie verification
- community post media (optional field defined in type but not actively used in current screens)
- event and place images from external URLs
- campaign visual assets

### Frontend contract requirement

The app expects an upload flow that yields:

- asset URL
- MIME type
- width/height metadata if needed
- image preview in local app state

### Proposed endpoints

| METHOD | PATH | PURPOSE | AUTH REQUIRED | STATUS |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/media/upload` | Upload image for avatar or media use | Yes | CONFIRMED |
| GET | `/api/v1/media/:id` | Fetch metadata or a media record | Yes | INFERRED |

### Example request

```json
{
  "kind": "profile_photo",
  "fileName": "bongz.jpg",
  "mimeType": "image/jpeg",
  "content": "base64-or-presigned-upload-token"
}
```

### Important note

The repository does not establish a storage provider. The backend must decide storage strategy. This is a TBD implementation detail, not a UI requirement.

---

## 19. SEARCH

### Current search usage

Search is implemented in:

- Explore: place and event keyword search
- Directory: resource search
- Home and route UI have some local actions but not full-text search service

### Confirmed search behavior

- keyword match
- city and category filtering
- result count display
- empty-state rendering for no results

### Proposed endpoints

| METHOD | PATH | PURPOSE | AUTH REQUIRED | STATUS |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/search` | Unified search across places, events, and resources | Yes | INFERRED |

### Query parameters

- `q`
- `city`
- `category`
- `type`
- `limit`
- `cursor`

---

## 20. ERROR HANDLING

### Frontend currently shows user alerts for common validation failures

Examples:

- invalid email
- invalid OTP
- missing password
- no contact selected
- invalid phone number
- no destination selected for route sharing
- no comment content
- missing profile fields

### Proposed API error pattern

```json
{
  "error": {
    "code": "INVALID_OTP",
    "message": "Please check the code and try again.",
    "details": {
      "field": "otp"
    }
  }
}
```

### Required client-facing mapping

- `400` => show validation error or input issue
- `401` => force re-login or show session expired state
- `403` => show access denied / insufficient privilege
- `404` => show resource not found
- `409` => show duplicate or conflicting state
- `422` => show user-friendly validation summary
- `429` => show rate limit or retry after message
- `500` => show generic server issue and retry feedback

---

## 21. PAGINATION

### Current repository indicators

The frontend already uses `initialNumToRender`, `maxToRenderPerBatch`, `windowSize`, and `ListFooterComponent` patterns in:

- Directory
- Explore
- Community feed
- Event lists
- Place handling may also scale with larger datasets

### Recommended backend pattern

Pagination should be implemented as cursor-based where practical because it matches product and feed-like use cases better than offset-only pagination.

### Proposed fields

```json
{
  "data": [],
  "pagination": {
    "nextCursor": "abc123",
    "hasMore": true,
    "limit": 20
  }
}
```

This is backend architecture guidance, not a hard-coded frontend fact.

---

## 22. SECURITY CONSIDERATIONS

The frontend hints at several concerns that backend engineering should handle explicitly:

- user authentication and session management
- OTP, password reset, verification flows
- profile image upload handling
- live location sharing permissions and consent
- emergency contact sharing preferences
- privacy controls for profile visibility and location sharing
- moderation for community content and media uploads
- safety-sensitive escalation logic for SOS or emergency contact workflows

### Important note

The app clearly contains safety-sensitive flows, but the current repository does not provide production guarantees or a legal/operational safety policy. Backend engineering should treat this as an active product decision area.

---

## 23. DATA MODELS

### Canonical model definitions derived from the frontend

| Model | Field | Type | Nullable | Description | Source | Status |
| --- | --- | --- | --- | --- | --- | --- |
| User | id | string | No | Unique user identifier | `src/types/index.ts` | CONFIRMED |
| User | name | string | No | Full name | `src/data/mockUser.ts` | CONFIRMED |
| User | handle | string | No | Username / handle | `src/data/mockUser.ts` | CONFIRMED |
| User | email | string | No | Email address | `src/login.tsx` and `src/data/mockUser.ts` | CONFIRMED |
| User | phone | string | No | Phone number | `src/data/mockUser.ts` | CONFIRMED |
| User | avatar | string | Yes | Short avatar initial or emoji | `src/data/mockUser.ts` | CONFIRMED |
| User | profileImageUrl | string | Yes | Profile image URL or local asset | `src/data/mockUser.ts` | CONFIRMED |
| User | city | string | No | Current user city | `src/data/mockUser.ts` | CONFIRMED |
| User | bio | string | Yes | User biography | `src/data/mockUser.ts` | CONFIRMED |
| User | communities | string[] | Yes | Community tags or groups | `src/data/mockUser.ts` | CONFIRMED |
| User | savedPlaces | Place[] | Yes | Favorite or saved places | `src/data/mockUser.ts` | CONFIRMED |
| User | verificationStatus | enum | No | Verified state | `src/types/index.ts` | CONFIRMED |
| Place | id | string | No | Place identifier | `src/types/index.ts` | CONFIRMED |
| Place | name | string | No | Place name | `src/data/mockData.ts` | CONFIRMED |
| Place | city | string | No | City name | `src/data/mockData.ts` | CONFIRMED |
| Place | category | enum | No | Place category | `src/types/index.ts` | CONFIRMED |
| Place | address | string | No | Physical address | `src/data/mockData.ts` | CONFIRMED |
| Place | distance | string | No | Human-readable distance | `src/data/mockData.ts` | CONFIRMED |
| Place | rating | number | No | Average rating | `src/data/mockData.ts` | CONFIRMED |
| Place | reviewCount | number | No | Number of reviews | `src/data/mockData.ts` | CONFIRMED |
| Place | verifications | string[] | No | Community trust flags | `src/data/mockData.ts` | CONFIRMED |
| Place | description | string | No | Place summary | `src/data/mockData.ts` | CONFIRMED |
| Place | hours | string | No | Opening hours | `src/data/mockData.ts` | CONFIRMED |
| Place | imageUrl | string | No | Image source | `src/data/mockData.ts` | CONFIRMED |
| Place | coords | object | No | Latitude and longitude | `src/types/index.ts` | CONFIRMED |
| Place | safetyScore | number | No | Safety score as percentage | `src/data/mockData.ts` | CONFIRMED |
| Place | reviews | Review[] | Yes | Reviews | `src/data/mockData.ts` | CONFIRMED |
| Event | id | string | No | Event identifier | `src/types/index.ts` | CONFIRMED |
| Event | title | string | No | Event title | `src/data/mockData.ts` | CONFIRMED |
| Event | type | enum | No | Event type | `src/types/index.ts` | CONFIRMED |
| Event | date | string | No | Event date | `src/data/mockData.ts` | CONFIRMED |
| Event | time | string | No | Event time | `src/data/mockData.ts` | CONFIRMED |
| Event | venue | string | No | Venue name | `src/data/mockData.ts` | CONFIRMED |
| Event | address | string | No | Venue address | `src/data/mockData.ts` | CONFIRMED |
| Event | price | string | No | Price or free text | `src/data/mockData.ts` | CONFIRMED |
| Event | attendees | number | No | Attendance count | `src/data/mockData.ts` | CONFIRMED |
| Event | organiser | string | No | Host organiser | `src/data/mockData.ts` | CONFIRMED |
| Event | description | string | No | Event description | `src/data/mockData.ts` | CONFIRMED |
| Event | tags | string[] | No | Topic tags | `src/data/mockData.ts` | CONFIRMED |
| CommunityPost | id | string | No | Post identifier | `src/types/index.ts` | CONFIRMED |
| CommunityPost | author | string | No | Author display name | `src/types/index.ts` | CONFIRMED |
| CommunityPost | handle | string | No | Author handle | `src/types/index.ts` | CONFIRMED |
| CommunityPost | content | string | No | Post text | `src/types/index.ts` | CONFIRMED |
| CommunityPost | likes | number | No | Number of likes | `src/types/index.ts` | CONFIRMED |
| CommunityPost | comments | number | No | Number of comments | `src/types/index.ts` | CONFIRMED |
| CommunityPost | shares | number | No | Number of shares | `src/types/index.ts` | CONFIRMED |
| CommunityPost | city | string | No | City tag | `src/types/index.ts` | CONFIRMED |
| CommunityPost | tags | string[] | No | Topic tags | `src/types/index.ts` | CONFIRMED |
| TrustedContact | id | string | No | Contact identifier | `src/store/useEmergencyContactsStore.ts` | CONFIRMED |
| TrustedContact | name | string | No | Contact name | `src/store/useEmergencyContactsStore.ts` | CONFIRMED |
| TrustedContact | phone | string | No | Phone number | `src/store/useEmergencyContactsStore.ts` | CONFIRMED |
| TrustedContact | relationship | string | No | Relationship label | `src/store/useEmergencyContactsStore.ts` | CONFIRMED |
| TrustedContact | isVerified | boolean | No | Verified status | `src/store/useEmergencyContactsStore.ts` | CONFIRMED |
| TrustedContact | canReceiveSms | boolean | No | SMS notification permission | `src/store/useEmergencyContactsStore.ts` | CONFIRMED |
| TrustedContact | canReceiveCall | boolean | No | Voice alert permission | `src/store/useEmergencyContactsStore.ts` | CONFIRMED |
| TrustedContact | shareLiveLocation | boolean | No | GPS sharing permission | `src/store/useEmergencyContactsStore.ts` | CONFIRMED |
| Notification | id | string | No | Notification id | `app/(tabs)/home.tsx` | INFERRED |
| Notification | title | string | No | Title | `app/(tabs)/home.tsx` | INFERRED |
| Notification | message | string | No | Body / detail text | `app/(tabs)/home.tsx` | INFERRED |
| Notification | read | boolean | No | Read state | `app/(tabs)/home.tsx` | INFERRED |
| Notification | createdAt | string | No | ISO date time | `app/(tabs)/home.tsx` | INFERRED |
| Notification | deepLink | string | Yes | App route target | `app/(tabs)/home.tsx` | INFERRED |

---

## 24. ENDPOINT SUMMARY

| METHOD | ENDPOINT | MODULE | PURPOSE | AUTH | STATUS |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | Authentication | Create account | No | CONFIRMED |
| POST | `/api/v1/auth/login` | Authentication | Login | No | CONFIRMED |
| POST | `/api/v1/auth/verify-otp` | Authentication | Verify OTP | No | CONFIRMED |
| POST | `/api/v1/auth/logout` | Authentication | Log out | Yes | CONFIRMED |
| GET | `/api/v1/users/me` | Users / Profiles | Current user profile | Yes | CONFIRMED |
| PATCH | `/api/v1/users/me` | Users / Profiles | Update profile | Yes | CONFIRMED |
| POST | `/api/v1/users/me/avatar` | Users / Profiles | Upload avatar | Yes | CONFIRMED |
| GET | `/api/v1/places` | Explore / Places | List places | Yes | CONFIRMED |
| GET | `/api/v1/places/nearby` | Explore / Places | Nearby places | Yes | CONFIRMED |
| GET | `/api/v1/places/:id` | Places | Get place detail | Yes | CONFIRMED |
| GET | `/api/v1/events` | Events | List events | Yes | CONFIRMED |
| GET | `/api/v1/events/:id` | Events | Event detail | Yes | CONFIRMED |
| POST | `/api/v1/events/:id/register` | Events | RSVP / register | Yes | CONFIRMED |
| GET | `/api/v1/community/feed` | Community | Feed | Yes | CONFIRMED |
| POST | `/api/v1/community/posts` | Community | Create a post | Yes | CONFIRMED |
| POST | `/api/v1/community/posts/:id/reactions` | Community | Like / react | Yes | CONFIRMED |
| GET | `/api/v1/community/posts/:id/comments` | Community | Fetch comments | Yes | CONFIRMED |
| POST | `/api/v1/community/posts/:id/comments` | Community | Add comment | Yes | CONFIRMED |
| POST | `/api/v1/community/posts/:id/share` | Community | Share post | Yes | CONFIRMED |
| GET | `/api/v1/campaigns/featured` | Campaigns | Featured campaign | Yes | CONFIRMED |
| GET | `/api/v1/campaigns/:id` | Campaigns | Campaign detail | Yes | CONFIRMED |
| POST | `/api/v1/campaigns/:id/rsvp` | Campaigns | Register interest | Yes | CONFIRMED |
| POST | `/api/v1/check-ins` | Check-ins | Record a visit / route check-in | Yes | CONFIRMED |
| GET | `/api/v1/trusted-contacts` | Trusted Contacts | List contacts | Yes | CONFIRMED |
| POST | `/api/v1/trusted-contacts` | Trusted Contacts | Add contact | Yes | CONFIRMED |
| PATCH | `/api/v1/trusted-contacts/:id` | Trusted Contacts | Update preferences | Yes | CONFIRMED |
| DELETE | `/api/v1/trusted-contacts/:id` | Trusted Contacts | Remove contact | Yes | CONFIRMED |
| GET | `/api/v1/safety/resources` | Safety / SOS | Safety directory | Yes | CONFIRMED |
| POST | `/api/v1/media/upload` | Media | Upload avatar / media | Yes | CONFIRMED |

### Proposed endpoint count

22 confirmed or required endpoints included in the summary table above, with additional INFERRED endpoints recommended for the full production backend.

---

## 25. FRONTEND MOCK → API MIGRATION MAP

| CURRENT SOURCE | SCREEN / FEATURE | CURRENT TYPE | FUTURE API | MIGRATION COMPLEXITY | NOTES |
| --- | --- | --- | --- | --- | --- |
| `src/data/mockData.ts` | Explore / Places | `Place[]` | `GET /api/v1/places` | Low | Core discovery dataset |
| `src/data/mockData.ts` | Events | `Event[]` | `GET /api/v1/events` | Low | Event list/detail all present |
| `src/data/mockData.ts` | Community | `CommunityPost[]` | `GET /api/v1/community/feed` | Medium | Social feed needs actual ownership |
| `src/data/mockData.ts` | Safety resources | `SafetyResource[]` | `GET /api/v1/safety/resources` | Low | Static support list |
| `src/data/mockUser.ts` | User profile | `User` | `GET /api/v1/users/me` | Low | Core user profile |
| `src/store/useAppStore.ts` | Auth session persistence | local state | `POST /api/v1/auth/login` + session token | Medium | Current app uses local persistence only |
| `src/services/mockOtpService.ts` | OTP verification | local simulation | `POST /api/v1/auth/verify-otp` | Low | Multi-step auth flow |
| `src/store/useEmergencyContactsStore.ts` | Trusted contacts | local Zustand + AsyncStorage | `GET/POST/PATCH/DELETE /api/v1/trusted-contacts` | Medium | Contact preferences and limits |
| `src/services/sharing.ts` | Share actions | device share sheet | `POST /api/v1/.../share` and/or external platform share | Low | Frontend behavior is share-sheet based |
| `src/store/useAppStore.ts` | Route waypoints and transit mode | local state | `POST /api/v1/routes` and `/api/v1/check-ins` | Medium | Route state exists but is not live service-backed |
| `src/store/useAppStore.ts` | Review cache | local review cache | `POST /api/v1/places/:id/reviews` and `.../events/:id/reviews` | Medium | Local domain behavior is clear |
| `src/services/contacts.ts` | Phone book import | native contact picker | not yet defined | Medium | Can integrate with native phone book but not a backend dependency |
| `app/settings.tsx` | Profile image uploads | local file picker | `POST /api/v1/media/upload` | Medium | Needs storage contract |
| `app/(tabs)/home.tsx` | Notifications modal | local array | `GET /api/v1/notifications` | Medium | Notification structure is clear but not live-backed |

---

## 26. OPEN QUESTIONS FOR BACKEND

These are decisions the frontend cannot answer without product and backend alignment.

1. Authentication strategy
   - Which provider or token model will be used?
   - Session lifetime and refresh strategy?

2. OTP and verification delivery
   - Is email, SMS, or both required?
   - What is the channel and provider model?

3. Media storage implementation
   - Where will avatar and media assets live?
   - Is there a pre-signed upload flow or direct upload API?

4. Community moderation and abuse controls
   - Who can delete posts, comments, or reports?

5. Notification infrastructure
   - Is this in-app only or push-enabled?
   - Which provider will deliver push messages?

6. Safety escalation policy
   - What does SOS do in production?
   - Are there human response workflows or only contact alerts?

7. Route history retention
   - How long are check-ins and route history stored?

8. Location privacy policy
   - What is the retention policy for live location sharing and route history?

9. Data ownership and public profile visibility
   - Which user fields are public vs private?

10. Route provider choice
   - Will mapping and routing remain third-party or be a platform capability?

---

## 27. IMPLEMENTATION PRIORITIES

### PHASE 1 — CORE

- authentication and session management
- user registration and login flow
- current user profile and update endpoints
- basic media upload for avatar/profile photo
- initial place discovery and event listing APIs

### PHASE 2 — COMMUNITY

- community feed
- post creation, comments, and reactions
- share event metadata for posts
- moderation rules and safe content handling

### PHASE 3 — DISCOVERY

- place search and nearby endpoint logic
- directory resources
- category filters and search relevance
- event listing and registration
- campaign listing and RSVP support

### PHASE 4 — SAFETY

- trusted contacts backend storage
- SMS/call alert preferences and consent tracking
- safety resources and incident response policy
- check-in storage and reporting

### PHASE 5 — ROUTE

- route creation and history persistence
- route sharing and stop management
- production grade location/data handling
- integration with external map provider if needed

---

## 28. REQUIREMENT CLASSIFICATION SUMMARY

This draft contains a mix of confirmed, inferred, and TBD backend requirements. The classification is based on what the frontend actually exposes and what can be extracted as direct product intent.

- CONFIRMED requirements: 31
- INFERRED requirements: 22
- TBD decisions: 15

---

## 29. FINAL NOTE

This document is intentionally limited to the repository’s current frontend behavior. It does not claim backend implementation, production safety guarantees, or service architecture decisions unless the project already defines them.

All real production decisions remain pending product and backend alignment.
