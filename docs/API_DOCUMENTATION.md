# The Pink Plug API Specification

Version: 1.0  
Status: Engineering Handover  
API style: REST/JSON (proposed; no application backend exists in this repository)  
Evidence baseline: current working tree, 22 September 2026

## 1. Contract status and scope

This document defines the proposed frontend/backend contract derived from the current application. Endpoint names and wire formats are proposals for engineering implementation, not deployed endpoints. Production backend implementation, provider selection, and unresolved policy decisions remain engineering responsibilities. This is the final frontend-derived handover specification; decisions explicitly marked **ENGINEERING DECISION REQUIRED** must be resolved before the affected service is production-ready.

Status vocabulary:

| Label | Meaning |
| --- | --- |
| EXISTING | Code, UI, local storage, or device integration exists; never implies a deployed API |
| MOCKED | Simulated, hard-coded, local-only, or no-op behavior |
| PROPOSED | A wire contract defined here; no implementation found |
| REQUIRED | Needed to replace an observed frontend operation with a production service |
| REQUIRED FOR PRODUCTION | Security/lifecycle prerequisite, even if the current UI does not implement it |
| OPTIONAL | Not needed to preserve the current frontend behavior |
| PLANNED | Retained draft intent or conditional future service; not current functionality |
| ENGINEERING DECISION REQUIRED | Cannot be settled from repository evidence |

Every endpoint in section 6 is PROPOSED. Its additional label distinguishes current-flow replacement from conditional scope. API clients must be implemented later; current React Query provider setup does not call a backend.

Inventory: **71 fully specified proposed endpoint contracts**, **25 named data models**, **26 mock/local integration groups**, and **24 open engineering decision groups**. Conditional endpoints are included in the 71; this is not a claim that all 71 are required for the current UI or that any are deployed.

### Evidence and boundaries

Inspected all routes under `app/`, TypeScript/TSX source under `src/`, component event handlers, three services, both stores, context, types, mock data, package/config files, README, HANDOVER, and the original API draft. There are no separate root `components/`, `hooks/`, `services/`, `types/`, `contexts/`, `providers/`, or `utils/` application trees; relevant code is under `src/`. Presentation-only components and layout helpers add no independent API.

Important corrections to the draft:

- Registration collects name, surname, email, and phone, **not a password**. Login requires a password. Initial password provisioning is an unresolved integration gap; do not secretly add a password field to registration.
- Event registration collects name/email/phone. Campaign RSVP additionally collects role and an accessibility/special-request message.
- Places have a live review form; event reviews exist in types/mock data/store capability but the current event detail does not render a review form.
- Community comments currently increment a count without storing their text; home comments are a separate local array.
- Directory resources are not Places: they have area/detail/badge and no coordinates/contact fields.
- Maps use Leaflet, React Leaflet, WebView, CARTO tiles, and external Google Maps links. A production routing/location provider is not implemented.
- SMS/share sheets are device actions, not proof of delivery, live tracking, or a backend notification.
- Profile setup's “live location” changes strings and flags. No device location acquisition or background tracking was found.
- Notification preferences exist, but `expo-notifications`, push registration, and delivery code do not.
- No post/report/block menu behavior exists behind the community ellipsis icon.
- Profile “Groups” and “Activity” are placeholders; displayed route/review/following counts are hard-coded.
- Existing draft remains untouched at [API_REQUIREMENTS_DRAFT.md](API_REQUIREMENTS_DRAFT.md). Section 10 reconciles its retained requirements.

## 2. API conventions

### Environments and base URL

| Environment | Actual URL | Illustrative URL only |
| --- | --- | --- |
| Development | ENGINEERING CONFIGURATION REQUIRED | `https://api-dev.example.com/api/v1` |
| Staging | ENGINEERING CONFIGURATION REQUIRED | `https://api-staging.example.com/api/v1` |
| Production | ENGINEERING CONFIGURATION REQUIRED | `https://api.example.com/api/v1` |

Example domains are reserved; account/contact values and credentials are illustrative, while some public campaign display metadata comes from frontend fixtures. Do not call or message example contact values. Configure a proposed `EXPO_PUBLIC_API_BASE_URL` at build/update time after engineering approval; it is not currently read by source. Public variables are bundled and cannot contain secrets. EAS development/preview/production profiles do not themselves establish API environments; production currently shares the preview update channel. Keep backend environments, data, and credentials isolated. No real API hostname is implied by existing share URLs.

### Transport and identity

- HTTPS only. JSON UTF-8; camelCase fields. `Accept: application/json`; JSON bodies use `Content-Type: application/json`.
- IDs are opaque nonempty strings. UUIDs are acceptable, but mock IDs such as `p1` are not a required production format. Never identify sessions by device display name.
- Timestamps use ISO-8601 UTC with explicit timezone, such as `2026-09-22T10:00:00Z`. Dates without time retain date-only meaning; event display strings are not timestamps.
- Required means present. Optional means omitted when unavailable; null is allowed only when the model says so. PATCH omission means unchanged; null clears only nullable fields. Unknown write fields are rejected.
- Proposed authentication uses `Authorization: Bearer <access token>`. Required endpoints derive user identity from the validated session, never from request-supplied author/owner IDs. Public endpoints validate their own challenge/refresh credentials where stated. JWT versus opaque token is not decided.
- Public read access is not assumed for private community/user data. Catalogue reads default to authenticated access; public safety resources are the explicit exception. Public discovery may be approved later.
- Server assigns IDs, ownership, verification, aggregate counts, and audit timestamps. Never accept client-set `isVerified`, safety badges, ratings aggregates, or author names as authority.
- Responses for private/auth/location data use `Cache-Control: no-store`; public safety cache policy requires freshness/ownership review.

### Responses and HTTP status

Success uses `{"success":true,"data":MODEL_OR_ARRAY,"meta":{}}`. Section 6 includes concrete JSON examples. Error bodies always use this structure:

```json
{"success":false,"error":{"code":"VALIDATION_ERROR","message":"Unable to process request","fields":{"email":["Enter a valid email address"]}}}
```

`error.fields` is a map of request field paths to string arrays; use `{}` for non-field failures. Error messages must not expose credentials, internal exceptions, or another person's private data.

| HTTP status | Meaning |
| --- | --- |
| 200 | Successful read/update/action with response envelope |
| 201 | New resource created, including an OTP challenge or registration |
| 204 | Successful deletion/logout with **no response body**; deliberate envelope exception |
| 400 | Malformed JSON, malformed query syntax, unsupported request shape |
| 401 | Missing/invalid/expired session, credential, or challenge |
| 403 | Authenticated but forbidden operation |
| 404 | Unknown or inaccessible resource; avoid leaking private resource existence |
| 409 | Duplicate/conflicting resource, invalid transition, contact limit, idempotency conflict |
| 410 | Expired/revoked location share for an already authorized viewer only |
| 413 / 415 | Media too large / unsupported actual content type |
| 422 | Structurally valid request fails field/business validation |
| 429 | Rate limit exceeded; return `Retry-After` |
| 500 / 503 | Internal error / dependency temporarily unavailable; no false success |

### Collections, pagination, search, and sorting

The frontend currently filters complete in-memory arrays; no page/cursor UI or `onEndReached` pagination exists. **PROPOSED** uniform page/limit contract for growing collections: `page` defaults to 1; `limit` defaults to 20 and has proposed maximum 100. Both are positive integers. These defaults are contract recommendations, not observed frontend limits; approve before implementation.

```json
{"success":true,"data":[],"meta":{"page":1,"limit":20,"total":0,"totalPages":0}}
```

All collection endpoints use this strategy, including comments/reviews/notifications/history. Bounds and ordering must be stable; append ID as a tie-breaker. A page beyond the last returns 200 and an empty array. Detail resources' embedded compatibility arrays remain complete under this contract; they are not separately paginated or silently truncated. Migrate clients to dedicated collection endpoints before changing that compatibility behavior.

Match literal route segments before parameterized IDs: `/places/categories` and `/campaigns/featured` must not resolve as detail IDs. Reserve those literal names in their respective ID namespaces.

`search` is trimmed case-insensitive text. Filters combine with AND. Unknown enum values produce 422, not an empty fake success. Catalogue `sort` supports only the values stated per endpoint. There is no required global people/community search. Explore issues separate place/event queries; Directory searches its own dataset. Empty search means unfiltered results.

### Retry, concurrency, and idempotency

Creation/action endpoints marked with an idempotency requirement require a client-generated `Idempotency-Key`. Scope keys by authenticated principal (or auth challenge context), endpoint, and body digest; replay identical completed requests with their original response, reject a different body under the same key with 409. Persistence lifetime is ENGINEERING DECISION REQUIRED and must be published before client integration.

PUT saved-place membership and reaction deletion are idempotent. Repeated authorized resource deletion returns 204. Do not automatically retry OTP delivery, registration, RSVP, check-in, or deactivation without idempotency protection. Refresh rotates credentials and needs serialized client refresh plus a server-defined safe retry/reuse policy. PATCH conflicts must not silently overwrite privacy revocation or re-enable a location share; optimistic concurrency strategy is an open decision.

### Error catalogue

All endpoints inherit applicable `BAD_REQUEST` (400), `VALIDATION_ERROR` (422), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500), and `SERVICE_UNAVAILABLE` (503). Authenticated endpoints also inherit `UNAUTHENTICATED`/`SESSION_EXPIRED` (401), `FORBIDDEN` (403), and private-ID `NOT_FOUND` (404).

| Additional code | Status | Use |
| --- | --- | --- |
| INVALID_CREDENTIALS | 401 | Invalid password or refresh credential; avoid account enumeration |
| INVALID_OTP / OTP_EXPIRED | 401 | Invalid, consumed, or expired challenge/code |
| CONFLICT | 409 | Duplicate resource or state conflict |
| IDEMPOTENCY_CONFLICT | 409 | Same key, different operation body |
| CONTACT_LIMIT_REACHED | 409 | Atomic maximum of five contacts |
| DUPLICATE_CONTACT | 409 | Duplicate owner/normalized phone |
| MEDIA_TOO_LARGE / UNSUPPORTED_MEDIA_TYPE | 413 / 415 | Upload policy rejection |
| LOCATION_SHARE_EXPIRED | 410 | Authorized viewer's expired/revoked share |
| VERIFICATION_REQUIRED | 403 | Verified identity/consent prerequisite not met |

Rate-limit values, OTP attempt counts/expiry, session lifetimes, content length limits, and retention periods are **ENGINEERING DECISION REQUIRED**, not inferred numeric limits.

## 3. Frontend validation and integration rules

| Source | Observed validation / production implications |
| --- | --- |
| Register | Trimmed name and surname required; email contains @; phone nonempty; OTP six characters. Production must validate actual email/phone syntax. No password field. |
| Login | Email contains @ and password nonempty. Existing any-six-digit-code fallback is a prototype bypass and must not exist on the server. |
| Change password | Current password required; new password at least 8 characters, lowercase, uppercase, digit, symbol, no whitespace, different from current; confirmation matches; OTP six digits. Maximum/password provisioning/recovery policy remains open. |
| Profile setup | Nonempty location; at least one interest; contact step accepts a name OR phone; photo defaults to a mock. Production contact requires both; setup steps are not persisted as a completed profile today. |
| Profile settings | Editable name/email/phone/handle/city/bio without save validation. Do not invent maximum lengths or handle rules; engineering must specify these. |
| Event registration | Name/email/phone nonempty; no current email regex. Proposed server validates syntax and uses session identity. |
| Campaign RSVP | Full name/email/phone/role required; email uses basic nonspace @ and dot regex; message optional. Role must be one of the three exact UI labels. |
| Reviews | Integer 1–5; trimmed comment nonempty; blank headline becomes “My experience”. No maximum text lengths defined. |
| Community | Trimmed post/comment text nonempty; no attachment picker, text limits, or edit/delete form. |
| Emergency contacts | Name and normalized phone required; five-contact limit. Client normalization can produce invalid international numbers; server must validate E.164 and reject invalid values. |
| Deactivation | Nonempty password only in UI. Server must verify password/recent reauthentication; UI promises 365-day reactivation, which is not an approved retention policy. |
| Images | Native picker uses images, square crop, quality 0.8; browser accepts image/*. No max bytes/dimensions or MIME whitelist is established. |
| Nearby search | Route screen uses a fixed Johannesburg origin and 3.5 km filter. A real supplied location must be permission-based; never treat the constant as user GPS. |

Allowed enums: Place category `stay|eat|drink|party|shop|culture|wellness|services`; Event type `pride|party|drag|community|workshop|cultural`; VerificationType `queer_owned|queer_friendly|community_verified`; SafetyResource type `emergency|legal|crisis|hate_crime`; transit mode `walking|driving|transit`; user verification `verified|pending|unverified`. Setup interests: Community, Travel, Nightlife, Wellness, Events, Food, Music, Outdoor.

Directory category labels are exactly: Doctors, Therapists, Hospitals, Clinics, Pharmacies, Mental health, Legal aid, Support groups, Community centres, LGBTQ+ organisations, HIV/STI services, Family services, Shelters, Financial services, Fitness & wellness, Hair & beauty, Restaurants & cafes, Nightlife, Arts & culture, Retail, Travel & transport. “All” is a client-only no-filter option.

## 4. DATA MODELS

Field tables describe the proposed wire format, not new TypeScript code. Source-derived fields retain their names. Fields marked “proposed” support secure persistence or replace derived display values. Model examples below are synthetic. Only named fields are writable as specified by an endpoint; read models are not mass-assignment payloads.

### M01. Coords

Evidence: src/types/index.ts.

| Field | Type | Required | Nullable | Description |
| --- | --- | --- | --- | --- |
| latitude | number | yes | no | Latitude -90 to 90 |
| longitude | number | yes | no | Longitude -180 to 180 |

### M02. Review

Evidence: src/types/index.ts; ReviewSection; proposed authorId/createdAt.

| Field | Type | Required | Nullable | Description |
| --- | --- | --- | --- | --- |
| id | string | yes | no | Server identifier |
| user | string | yes | no | Display author, not email |
| avatar | string | yes | no | Display initial or emoji |
| rating | integer | yes | no | 1 to 5 |
| headline | string | yes | no | Defaults to My experience |
| comment | string | yes | no | Nonempty review text |
| timeAgo | string | yes | no | Compatibility relative display; adapter may derive |
| authorId | string | yes | no | Proposed immutable server attribution |
| createdAt | timestamp | yes | no | Proposed canonical creation time |

### M03. Place

Evidence: src/types/index.ts; nearby cards and place detail.

| Field | Type | Required | Nullable | Description |
| --- | --- | --- | --- | --- |
| id | string | yes | no | Place identifier |
| name | string | yes | no | Display name |
| city | string | yes | no | City |
| category | PlaceCategory | yes | no | Enum in section 3 |
| address | string | yes | no | Display street address |
| distance | string | yes | no | Compatibility label; empty string if origin unavailable, never fabricated |
| rating | number | yes | no | Aggregate 0 to 5; 0 when no reviews |
| reviewCount | integer | yes | no | Nonnegative total |
| verifications | VerificationType[] | yes | no | Server-curated badges |
| description | string | yes | no | Description |
| hours | string | yes | no | Display opening information, not a scheduling engine |
| imageUrl | HTTPS URL | yes | no | Renderable image |
| coords | Coords | yes | no | Place location, not current user location |
| safetyScore | number | yes | no | 0 to 100 displayed score; provenance/meaning requires approval |
| reviews | Review[] | yes | no | Compatibility collection; use reviews endpoint for complete pagination |

### M04. Event

Evidence: src/types/index.ts; EventCard and app/events/[id].tsx.

| Field | Type | Required | Nullable | Description |
| --- | --- | --- | --- | --- |
| id | string | yes | no | Event identifier |
| title | string | yes | no | Display title |
| type | EventType | yes | no | Enum in section 3 |
| date | string | yes | no | Current display date; timezone/source date policy must be agreed |
| time | string | yes | no | Current display time |
| venue | string | yes | no | Venue name |
| address | string | yes | no | Directions address |
| price | string | yes | no | Display price; no payment API implied |
| attendees | integer | yes | no | Nonnegative authoritative count |
| imageUrl | HTTPS URL | yes | no | API replaces bundled ImageSourcePropType |
| organiser | string | yes | no | Display host |
| descriptionHeading | string | no | no | Optional heading |
| descriptionLead | string | no | no | Optional lead paragraph |
| description | string | yes | no | Body text |
| tags | string[] | yes | no | Display tags |
| rating | number | yes | no | 0 to 5 aggregate |
| reviewCount | integer | yes | no | Nonnegative total |
| reviews | Review[] | yes | no | Type/mock field; current detail has no review form |

### M05. User

Evidence: src/types/index.ts; MOCK_USER; proposed setup fields.

| Field | Type | Required | Nullable | Description |
| --- | --- | --- | --- | --- |
| id | string | yes | no | Session owner's identifier |
| name | string | yes | no | Full display name; register name/surname join policy needs approval |
| handle | string | yes | no | Displayed username; uniqueness/case rules unresolved |
| email | string | yes | no | Private email; changes require verification |
| phone | string | yes | no | Private E.164 phone |
| avatar | string | yes | no | Initial or emoji fallback |
| profileImageUrl | HTTPS URL | no | no | Visibility-authorized profile image; omitted when unavailable; no local blob or require value |
| city | string | yes | no | User-selected locality; never store Live location active here |
| bio | string | yes | no | May be empty |
| communities | string[] | yes | no | Current membership labels, read-only until membership workflow exists |
| savedPlaces | Place[] | yes | no | Compatibility list; dedicated paginated endpoint is canonical for large lists |
| verificationStatus | UserVerification | yes | no | Server-controlled |
| interests | string[] | yes | no | Proposed persisted setup interests, empty before setup |
| profileSetupComplete | boolean | yes | no | Proposed server completion status |

### M06. Session

Evidence: app/manage-sessions.tsx; proposed stable ID and timestamp.

| Field | Type | Required | Nullable | Description |
| --- | --- | --- | --- | --- |
| id | string | yes | no | Stable revocable session ID |
| device | string | yes | no | Device display label, not unique identity |
| location | string | yes | no | Coarse session location label; no precise GPS requirement |
| current | boolean | yes | no | Current caller's session |
| lastSeen | string | yes | no | Compatibility display label |
| lastSeenAt | timestamp | yes | no | Proposed canonical last activity |

### M07. AuthChallenge

Evidence: PROPOSED secure replacement for mock OTP.

| Field | Type | Required | Nullable | Description |
| --- | --- | --- | --- | --- |
| challengeId | string | yes | no | Opaque purpose-bound challenge |
| purpose | enum | yes | no | register, login, password_change, password_reset |
| delivery | enum | yes | no | email or sms; email matches current register/login |
| maskedDestination | string | yes | no | Do not disclose full destination |
| expiresAt | timestamp | yes | no | Server policy; example duration is not a requirement |
| resendAfter | timestamp | yes | no | Server-controlled next delivery time |

### M08. AuthSession

Evidence: PROPOSED secure session result.

| Field | Type | Required | Nullable | Description |
| --- | --- | --- | --- | --- |
| accessToken | string | yes | no | Bearer secret; example is inert |
| refreshToken | string | yes | no | Rotating mobile credential; web cookie adaptation requires design |
| expiresAt | timestamp | yes | no | Access expiry |
| session | Session | yes | no | Current session metadata |
| user | User | yes | no | Private owner profile |

### M09. DirectoryResource

Evidence: src/types/index.ts and src/data/directoryData.ts.

| Field | Type | Required | Nullable | Description |
| --- | --- | --- | --- | --- |
| id | string | yes | no | Resource identifier |
| name | string | yes | no | Resource display name |
| category | string | yes | no | Directory category label |
| city | string | yes | no | City |
| area | string | yes | no | Neighborhood |
| description | string | yes | no | Summary |
| detail | string | yes | no | Opening/booking/service note |
| badge | string | yes | no | Curated display badge, not client-authored credential |

### M10. Category

Evidence: PROPOSED transport for existing fixed category lists.

| Field | Type | Required | Nullable | Description |
| --- | --- | --- | --- | --- |
| value | string | yes | no | Place enum, event enum, or directory label |
| label | string | yes | no | Human-readable label |

### M11. CommunityPost

Evidence: src/types/index.ts; proposed ownership/time/viewer state.

| Field | Type | Required | Nullable | Description |
| --- | --- | --- | --- | --- |
| id | string | yes | no | Post ID |
| author | string | yes | no | Display author |
| avatar | string | yes | no | Initial or emoji |
| handle | string | yes | no | Display handle |
| content | string | yes | no | Nonempty text |
| imageUrl | HTTPS URL | no | no | Type supports image, composer currently does not |
| likes | integer | yes | no | Nonnegative count |
| comments | integer | yes | no | Nonnegative count |
| shares | integer | yes | no | Count semantics require approval; not proof of delivery |
| timeAgo | string | yes | no | Compatibility label |
| city | string | yes | no | Selected community city |
| tags | string[] | yes | no | Server-derived/curated until tag input exists |
| authorId | string | yes | no | Proposed server attribution |
| createdAt | timestamp | yes | no | Proposed creation time |
| likedByMe | boolean | yes | no | Proposed persistent viewer reaction |

### M12. Comment

Evidence: Home comment shape plus proposed persistence identity.

| Field | Type | Required | Nullable | Description |
| --- | --- | --- | --- | --- |
| id | string | yes | no | Comment ID |
| postId | string | yes | no | Proposed parent association |
| author | string | yes | no | Display author |
| text | string | yes | no | Nonempty body; canonical field maps community draft to home text |
| authorId | string | yes | no | Server attribution |
| createdAt | timestamp | yes | no | Creation time |

### M13. EmergencyContact

Evidence: src/store/useEmergencyContactsStore.ts.

| Field | Type | Required | Nullable | Description |
| --- | --- | --- | --- | --- |
| id | string | yes | no | Owner-scoped ID |
| name | string | yes | no | Chosen contact name |
| phone | string | yes | no | Validated E.164 |
| relationship | string | yes | no | Free text, defaults Friend |
| isVerified | boolean | yes | no | Server-controlled; invitation acceptance not implemented |
| canReceiveSms | boolean | yes | no | Owner preference; not recipient consent |
| canReceiveCall | boolean | yes | no | Owner preference; not recipient consent |
| shareLiveLocation | boolean | yes | no | Preference only, not an active authorization grant |

### M14. SafetyResource

Evidence: src/types/index.ts.

| Field | Type | Required | Nullable | Description |
| --- | --- | --- | --- | --- |
| id | string | yes | no | Resource ID |
| title | string | yes | no | Display title |
| description | string | yes | no | Summary |
| phoneContact | string | no | no | Dialable number, may be a short emergency code |
| websiteUrl | HTTPS URL | no | no | External resource link |
| resourceType | ResourceType | yes | no | Enum in section 3 |

### M15. Campaign

Evidence: CircleOfLoveCard campaign object; proposed ID.

| Field | Type | Required | Nullable | Description |
| --- | --- | --- | --- | --- |
| id | string | yes | no | Proposed identifier |
| title | string | yes | no | Campaign title |
| host | string | yes | no | Display host |
| date | string | yes | no | Display date, not a UTC timestamp |
| location | string | yes | no | Display locality |
| image | HTTPS URL | yes | no | Replaces bundled image require |
| tags | string[] | yes | no | Display tags |
| metrics | array of {label:string,value:string} | yes | no | Each item requires both non-null display fields |

### M16. EventRegistration

Evidence: Event detail registration form; proposed persistence metadata.

| Field | Type | Required | Nullable | Description |
| --- | --- | --- | --- | --- |
| id | string | yes | no | Server receipt ID |
| eventId | string | yes | no | Registered event |
| name | string | yes | no | Registrant name |
| email | string | yes | no | Contact email |
| phone | string | yes | no | E.164 |
| createdAt | timestamp | yes | no | Receipt creation; payment/ticketing not implied |

### M17. CampaignRsvp

Evidence: CircleOfLoveCard RsvpForm; proposed ID and timestamp.

| Field | Type | Required | Nullable | Description |
| --- | --- | --- | --- | --- |
| id | string | yes | no | Server receipt ID |
| campaignId | string | yes | no | Campaign |
| fullName | string | yes | no | Full name |
| email | string | yes | no | Contact email |
| phone | string | yes | no | WhatsApp/phone E.164; no WhatsApp delivery implied |
| role | ParticipationRole | yes | no | Couple Joining Mass Wedding; Guest / Supporter; Media / Press |
| message | string | yes | no | Optional input normalized to empty string; may contain sensitive accessibility needs |
| createdAt | timestamp | yes | no | Receipt creation |

### M18. UserSettings

Evidence: settings.tsx and privacy-settings.tsx; canonical proposed persistence.

| Field | Type | Required | Nullable | Description |
| --- | --- | --- | --- | --- |
| pushNotifications | boolean | yes | no | Master push preference |
| mutePushNotifications | boolean | yes | no | Mute wins; duration not specified by UI |
| pushNewEvent | boolean | yes | no | Event push preference |
| pushCommunityReview | boolean | yes | no | Review push preference |
| emailNotifications | boolean | yes | no | Master email preference |
| muteEmailNotifications | boolean | yes | no | Mute wins |
| emailNewEvent | boolean | yes | no | Event email preference |
| emailCommunityReview | boolean | yes | no | Review email preference |
| twoFactorEnabled | boolean | yes | no | Effective server enrollment, not blindly client-writable |
| loginAlerts | boolean | yes | no | New-login alert preference |
| profileVisible | boolean | yes | no | One canonical value for both settings screens |
| shareLocation | boolean | yes | no | Permission preference, not consent to continuous collection |
| showLocation | boolean | yes | no | Coarse city/route visibility, not public precise GPS |
| allowMessages | boolean | yes | no | Consent preference; no messaging service exists |
| dataSharing | boolean | yes | no | Analytics consent; purposes must be disclosed |

### M19. Media

Evidence: PROPOSED transport for selected profile/selfie images.

| Field | Type | Required | Nullable | Description |
| --- | --- | --- | --- | --- |
| id | string | yes | no | Owner-scoped media ID |
| kind | enum | yes | no | profile_photo or verification_selfie |
| mimeType | string | yes | no | Verified actual content type |
| sizeBytes | integer | yes | no | Positive stored size |
| url | HTTPS URL | yes | yes | Visibility-authorized profile image URL only; null for private verification media |
| width | integer | yes | no | Positive decoded width |
| height | integer | yes | no | Positive decoded height |
| createdAt | timestamp | yes | no | Upload completion time |

### M20. SelfieVerification

Evidence: PROPOSED replacement for 1600 ms local success timer.

| Field | Type | Required | Nullable | Description |
| --- | --- | --- | --- | --- |
| id | string | yes | no | Submission ID |
| status | enum | yes | no | pending, verified, rejected |
| createdAt | timestamp | yes | no | Submitted time |
| completedAt | timestamp | yes | yes | Null while pending; verification method undecided |

### M21. Notification

Evidence: home.tsx id/title/detail/time; proposed persistent read state.

| Field | Type | Required | Nullable | Description |
| --- | --- | --- | --- | --- |
| id | string | yes | no | Notification ID |
| title | string | yes | no | Display title |
| detail | string | yes | no | Display body; maps draft message to existing detail |
| time | string | yes | no | Compatibility relative label |
| createdAt | timestamp | yes | no | Canonical time |
| read | boolean | yes | no | Proposed persistent read state |

### M22. Device

Evidence: PLANNED push integration; no current registration.

| Field | Type | Required | Nullable | Description |
| --- | --- | --- | --- | --- |
| id | string | yes | no | Owner-scoped installation registration |
| platform | enum | yes | no | ios or android; web push out of scope |
| provider | enum | yes | no | expo proposed only if engineering selects Expo push |
| createdAt | timestamp | yes | no | Registration time |

### M23. Route

Evidence: PLANNED persistence from waypoints/mode/start/end/departure UI.

| Field | Type | Required | Nullable | Description |
| --- | --- | --- | --- | --- |
| id | string | yes | no | Owner-scoped route |
| mode | TransitMode | yes | no | walking, driving, transit |
| placeIds | string[] | yes | no | Ordered unique waypoints; expands to existing Waypoint.place in adapter |
| selectedPlaceId | string | yes | yes | Destination or null |
| status | enum | yes | no | draft, active, ended |
| departureAt | timestamp | yes | yes | Proposed canonical scheduled time, null for none |
| startedAt | timestamp | yes | yes | Null until started |
| endedAt | timestamp | yes | yes | Null until ended |

### M24. CheckIn

Evidence: Route local checkedInPlace/checkedInAt; proposed persistence.

| Field | Type | Required | Nullable | Description |
| --- | --- | --- | --- | --- |
| id | string | yes | no | Check-in ID |
| placeId | string | yes | no | User-selected place, not verified GPS presence |
| routeId | string | no | no | Optional owned route |
| createdAt | timestamp | yes | no | Server receipt time |
| observedAt | timestamp | yes | no | Client action time, validated for clock skew |
| status | enum | yes | no | recorded; does not mean emergency dispatched |

### M25. LocationShare

Evidence: PLANNED optional expiring one-shot share, not existing live tracking.

| Field | Type | Required | Nullable | Description |
| --- | --- | --- | --- | --- |
| id | string | yes | no | Share ID, not a public bearer secret |
| coords | Coords | yes | no | Snapshot from consented device reading |
| accuracyMeters | number | yes | no | Nonnegative reported accuracy |
| observedAt | timestamp | yes | no | Time of measurement |
| expiresAt | timestamp | yes | no | Mandatory expiry; policy maximum unresolved |
| status | enum | yes | no | active, revoked, expired |
| recipientContactIds | string[] | yes | no | Owned consented/verified trusted-contact ACL |
| privacyLevel | PrivacyLevel | yes | no | exact, fuzzed_300m, city_only from existing type; UI choice is not wired |

### Model mapping notes

- User is the private Profile contract; there is no separate invented public-profile schema. Never send private User wholesale as a community author.
- Transport additions (session IDs, timestamps, media IDs, auth challenges, comment persistence, viewer reaction state) are PROPOSED, not fields already declared by the frontend.
- `ImageSourcePropType`, `require()`, browser blob URLs, and local file URIs are not JSON media identifiers. API images are HTTPS URLs; uploads yield owned media IDs.
- `timeAgo`/`time`/`lastSeen` are compatibility display fields, not authoritative clocks. An integration adapter should derive them from canonical timestamps.
- Current `Place.reviews`, `Event.reviews`, and `User.savedPlaces` are complete compatibility snapshots. When migrating to paginated endpoints, use authoritative totals rather than treating a page's length as a total.
- Profile-image delivery must enforce ownership and approved profile visibility, including access through the image URL itself; hiding JSON metadata alone is insufficient. Verification images never receive a public URL.
- Profile route/review/following counters have no validated domain source. Do not return hard-coded 4/12/89 as production metrics. Following/groups/activity and moderation Report models are deferred until their product behavior is defined.
- API text is untrusted. React Native text, web HTML, and native WebView interpolation require context-appropriate escaping.

## 5. Feature lifecycle and service boundaries

### Authentication, profile, and settings

Proposed lifecycle: pending registration → email challenge → verified session → profile setup; login → verified password → challenge → verified session; refresh rotates credentials; logout/session revocation invalidate credentials server-side. Initial password provisioning is unresolved because registration has no password input. Recovery is retained as a production gap; the current “Forgot password?” link opens the authenticated change-password form.

Register/login verify email in current mock behavior. A phone field does not establish SMS verification. Delivery switching, phone verification, changed-email/phone verification, social provider exchanges, two-factor enrollment/recovery, and biometric unlock require approved protocols. Device biometrics should unlock securely stored credentials rather than being transmitted as raw biometric data to a generic login API.

Profile setup collects interests, location text, contacts, and photo but does not save a complete profile. Future integration should persist profile fields, save valid contacts, attach owned media, then mark completion. Partial failure must not display “Profile ready.” Memberships, verification badges, and stats must come from authorized services, not client values. No editable pronouns, date of birth, gender, or identity-document fields exist; none are invented here.

Settings that must follow the user are modeled by UserSettings. Device theme, OS permissions, navigation state, drafts, and modal expansion do not need an API. Two independently mocked profile-visibility controls must converge. Location visibility and location sharing are different controls: hiding city/route access is not the same as ending a grant.

### Media strategy

Use authenticated multipart upload for current profile-photo and selfie inputs, then reference the returned media ID in profile/verification requests. A storage-provider signed-upload strategy may replace this by explicit contract revision; storage credentials must never reach clients. The document does not require both strategies.

Maximum bytes, dimensions, allowed raster MIME types, quotas, scanning, orphan expiry, and transformed-image retention are **ENGINEERING DECISION REQUIRED** because the UI has no numeric limits. The illustrative JPEG response is not a completed allowlist. This policy must be configured before accepting production uploads. Strip embedded location metadata. Authorization applies to upload, read, attachment, replacement, and deletion. Do not publish verification selfies as profile photos by default, despite the current UI reusing the chosen image.

There is no current event-image administration flow or community attachment composer. Event/place/campaign images are read-only content. CommunityPost.imageUrl remains a type-level optional field, not an upload mandate.

### Location privacy and safety

No continuous collection is required. Current routes use fixed coordinates, calculated mock travel metrics, timers, selected places, and device-generated SMS/share sheets. Prefer retaining local route planning unless cloud persistence is explicitly approved.

An optional hosted location share needs: foreground permission, explicit purpose, measured latitude/longitude, accuracy, observedAt, expiry, an authenticated owner, consented recipient identity, and immediate revocation. Never substitute a venue pin for measured user location. A share preference or verified phone number alone is not consent.

The conditional LocationShare contract below supports **one-shot exact snapshots only after explicit consent**. Existing PrivacyLevel includes fuzzed_300m/city_only, but those UI modes are not wired. Reject non-exact modes until their coarse-area/city wire schemas and transformations are approved; do not return exact coordinates under a coarse label. Maximum lifetime, precision algorithm, recipient onboarding, access logging, retention, and deletion schedules remain open.

Require ownership and recipient ACL checks on every read; possession of a share ID is insufficient. Default deny. Revocation, contact deletion, preference withdrawal, account/session revocation, and expiry must invalidate access. Do not permit sensitive caching. Delete or irreversibly de-identify expired location according to approved policy; do not silently build a movement history.

The existing static map links in SMS cannot be revoked after sending. A hosted share would require a different viewer/link flow, which does not currently exist. No automatic SMS/call delivery, emergency escalation, or police/ambulance dispatch is specified. SOS remains an OS dialer link. Real alert delivery needs separately approved recipient consent, acknowledgement, retries, escalation, operator ownership, and reliability claims.

### Community, reporting, and notifications

Current community supports feed display, text compose, like/unlike, comment submission, and external sharing. Home's embedded safety post must map to a real post before attaching comments or shares. Existing share counters do not prove delivery; use explicit acknowledged actions only if analytics is approved. No backend share endpoint is required for an OS share sheet.

No current post editing/deletion, review editing/deletion, blocking, reporting, direct-message conversation, group membership mutation, or moderation UI was found. Keep ownership/moderation/deletion requirements in the decision register; do not invent their payloads. Production community needs an abuse response process before launch even if reporting UI is not yet designed.

In-app notifications and push/email preferences are separate. In-app reads can be implemented without push. Device registration below is conditional on selecting Expo push; no Expo notification dependency/token acquisition exists now. Respect OS consent, per-account preferences, installation ownership, revoked sessions, and provider failure feedback. Do not expose provider credentials or put precise locations, OTPs, or sensitive identity data into notification previews.

## 6. Endpoint specifications

All paths are proposed under /api/v1. Each specification explicitly inherits section 2 conventions and section 3 validation. “None” means no path/query/body is accepted in that category. Header token examples are illustrative, not credentials. Path IDs are URL-encoded opaque strings and checked against the resource and caller. Collection example total=1 is illustrative; real totals are computed.

Error Responses in each entry enumerate common and feature-specific failures; the included error JSON is one concrete example of the shared envelope. HTTP 204 is intentionally bodyless. No endpoint is reported as deployed.

### Endpoint index

| ID | Method and path | Additional status |
| --- | --- | --- |
| E01 | POST `/api/v1/auth/register` | REQUIRED · current behavior MOCKED |
| E02 | POST `/api/v1/auth/login` | REQUIRED · current behavior MOCKED |
| E03 | POST `/api/v1/auth/verify-otp` | REQUIRED · current behavior MOCKED |
| E04 | POST `/api/v1/auth/otp/resend` | REQUIRED · current behavior MOCKED |
| E05 | POST `/api/v1/auth/refresh` | REQUIRED FOR PRODUCTION |
| E06 | POST `/api/v1/auth/logout` | REQUIRED · current behavior MOCKED |
| E07 | GET `/api/v1/auth/session` | REQUIRED FOR PRODUCTION |
| E08 | GET `/api/v1/auth/sessions` | REQUIRED · current behavior MOCKED |
| E09 | DELETE `/api/v1/auth/sessions/:id` | REQUIRED · current behavior MOCKED |
| E10 | DELETE `/api/v1/auth/sessions` | REQUIRED · current behavior MOCKED |
| E11 | POST `/api/v1/auth/change-password/challenge` | REQUIRED · current behavior MOCKED |
| E12 | POST `/api/v1/auth/change-password` | REQUIRED · current behavior MOCKED |
| E13 | POST `/api/v1/auth/forgot-password` | PLANNED · REQUIRED FOR PRODUCTION recovery gap |
| E14 | POST `/api/v1/auth/reset-password` | PLANNED · REQUIRED FOR PRODUCTION recovery gap |
| E15 | GET `/api/v1/users/me` | REQUIRED · current behavior MOCKED |
| E16 | PATCH `/api/v1/users/me` | REQUIRED · current behavior MOCKED |
| E17 | POST `/api/v1/users/me/deactivate` | REQUIRED · current behavior MOCKED |
| E18 | DELETE `/api/v1/users/me` | PLANNED · privacy lifecycle, no current deletion control |
| E19 | GET `/api/v1/users/me/settings` | REQUIRED · current behavior MOCKED |
| E20 | PATCH `/api/v1/users/me/settings` | REQUIRED · current behavior MOCKED |
| E21 | POST `/api/v1/media/upload` | REQUIRED · current behavior MOCKED |
| E22 | GET `/api/v1/media/:id` | PLANNED / OPTIONAL · not currently wired |
| E23 | DELETE `/api/v1/media/:id` | PROPOSED · upload lifecycle hygiene |
| E24 | POST `/api/v1/users/me/selfie-verifications` | REQUIRED · current behavior MOCKED |
| E25 | GET `/api/v1/users/me/selfie-verifications/:id` | REQUIRED · current behavior MOCKED |
| E26 | GET `/api/v1/places` | REQUIRED · current behavior MOCKED |
| E27 | GET `/api/v1/places/:id` | REQUIRED · current behavior MOCKED |
| E28 | GET `/api/v1/places/categories` | PROPOSED · OPTIONAL remote taxonomy |
| E29 | GET `/api/v1/users/me/saved-places` | REQUIRED · current behavior MOCKED |
| E30 | PUT `/api/v1/users/me/saved-places/:id` | REQUIRED · current behavior MOCKED |
| E31 | DELETE `/api/v1/users/me/saved-places/:id` | REQUIRED · current behavior MOCKED |
| E32 | GET `/api/v1/places/:id/reviews` | REQUIRED · current behavior MOCKED |
| E33 | POST `/api/v1/places/:id/reviews` | REQUIRED · current behavior MOCKED |
| E34 | GET `/api/v1/events` | REQUIRED · current behavior MOCKED |
| E35 | GET `/api/v1/events/:id` | REQUIRED · current behavior MOCKED |
| E36 | POST `/api/v1/events/:id/register` | REQUIRED · current behavior MOCKED |
| E37 | GET `/api/v1/events/:id/reviews` | PLANNED / OPTIONAL · not currently wired |
| E38 | POST `/api/v1/events/:id/reviews` | PLANNED / OPTIONAL · not currently wired |
| E39 | GET `/api/v1/directory/resources` | REQUIRED · current behavior MOCKED |
| E40 | GET `/api/v1/directory/categories` | PROPOSED · OPTIONAL remote taxonomy |
| E41 | GET `/api/v1/community/feed` | REQUIRED · current behavior MOCKED |
| E42 | POST `/api/v1/community/posts` | REQUIRED · current behavior MOCKED |
| E43 | GET `/api/v1/community/posts/:id` | PLANNED / OPTIONAL · not currently wired |
| E44 | GET `/api/v1/community/posts/:id/comments` | REQUIRED · current behavior MOCKED |
| E45 | POST `/api/v1/community/posts/:id/comments` | REQUIRED · current behavior MOCKED |
| E46 | POST `/api/v1/community/posts/:id/reactions` | REQUIRED · current behavior MOCKED |
| E47 | DELETE `/api/v1/community/posts/:id/reactions` | REQUIRED · current behavior MOCKED |
| E48 | GET `/api/v1/campaigns/featured` | REQUIRED · current behavior MOCKED |
| E49 | GET `/api/v1/campaigns` | PLANNED / OPTIONAL · not currently wired |
| E50 | GET `/api/v1/campaigns/:id` | PLANNED / OPTIONAL · not currently wired |
| E51 | POST `/api/v1/campaigns/:id/rsvp` | REQUIRED · current behavior MOCKED |
| E52 | GET `/api/v1/trusted-contacts` | REQUIRED · current behavior MOCKED |
| E53 | POST `/api/v1/trusted-contacts` | REQUIRED · current behavior MOCKED |
| E54 | PATCH `/api/v1/trusted-contacts/:id` | REQUIRED · current behavior MOCKED |
| E55 | DELETE `/api/v1/trusted-contacts/:id` | REQUIRED · current behavior MOCKED |
| E56 | GET `/api/v1/safety/resources` | REQUIRED · current behavior MOCKED |
| E57 | GET `/api/v1/notifications` | REQUIRED · current behavior MOCKED |
| E58 | PATCH `/api/v1/notifications/:id/read` | PLANNED / OPTIONAL · not currently wired |
| E59 | PATCH `/api/v1/notifications/read-all` | PLANNED / OPTIONAL · not currently wired |
| E60 | POST `/api/v1/devices` | PLANNED · REQUIRED if push settings are delivered |
| E61 | DELETE `/api/v1/devices/:id` | PLANNED · REQUIRED if push is implemented |
| E62 | POST `/api/v1/routes` | PLANNED / OPTIONAL · not currently wired |
| E63 | GET `/api/v1/routes` | PLANNED / OPTIONAL · not currently wired |
| E64 | GET `/api/v1/routes/:id` | PLANNED / OPTIONAL · not currently wired |
| E65 | PATCH `/api/v1/routes/:id` | PLANNED / OPTIONAL · not currently wired |
| E66 | POST `/api/v1/check-ins` | PROPOSED · REQUIRED if check-in becomes durable |
| E67 | GET `/api/v1/check-ins` | PLANNED / OPTIONAL · not currently wired |
| E68 | GET `/api/v1/check-ins/:id` | PLANNED / OPTIONAL · not currently wired |
| E69 | POST `/api/v1/location-shares` | PLANNED / OPTIONAL · security-gated snapshot service |
| E70 | GET `/api/v1/location-shares/:id` | PLANNED / OPTIONAL · security-gated snapshot service |
| E71 | DELETE `/api/v1/location-shares/:id` | PLANNED / OPTIONAL · security-gated snapshot service |

### E01. POST /api/v1/auth/register

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Create a pending account and send email verification.
- **Authentication:** Public.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Content-Type: application/json; Idempotency-Key: unique request key (required).
- **Request Body / Validation:** name:string required; surname:string required; email:string required; phone:E.164 string required. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 201.
- **Success Response schema:** AuthChallenge in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 409 IDEMPOTENCY_CONFLICT. 409 CONFLICT only where disclosure is safe; 422 invalid identity fields.
- **Frontend Consumer:** app/register.tsx.
- **Notes:** No password input exists. Initial password provisioning must be agreed before release. A duplicate-email response must not become an account-enumeration oracle.

Request example:

```json
{
  "name": "Sample",
  "surname": "Member",
  "email": "member@example.com",
  "phone": "+27820000000"
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "challengeId": "challenge_01",
    "purpose": "register",
    "delivery": "email",
    "maskedDestination": "m***@example.com",
    "expiresAt": "2026-09-22T10:10:00Z",
    "resendAfter": "2026-09-22T10:01:00Z"
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Unable to process request",
    "fields": {
      "name": [
        "Invalid value"
      ]
    }
  }
}
```

### E02. POST /api/v1/auth/login

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Validate credentials before issuing an OTP challenge.
- **Authentication:** Public.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Content-Type: application/json; Idempotency-Key: unique request key (required).
- **Request Body / Validation:** email:string required; password:string required. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 201.
- **Success Response schema:** AuthChallenge in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 409 IDEMPOTENCY_CONFLICT. 401 INVALID_CREDENTIALS; 403 VERIFICATION_REQUIRED for a controlled reactivation/setup workflow.
- **Frontend Consumer:** app/login.tsx.
- **Notes:** Return no tokens until OTP succeeds. Existing local fallback accepts arbitrary six-digit input; server must not replicate it.

Request example:

```json
{
  "email": "member@example.com",
  "password": "Example-Only9!"
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "challengeId": "challenge_01",
    "purpose": "login",
    "delivery": "email",
    "maskedDestination": "m***@example.com",
    "expiresAt": "2026-09-22T10:10:00Z",
    "resendAfter": "2026-09-22T10:01:00Z"
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Unable to process request",
    "fields": {
      "email": [
        "Invalid value"
      ]
    }
  }
}
```

### E03. POST /api/v1/auth/verify-otp

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Consume a register/login challenge and establish a session.
- **Authentication:** Public; challenge credential required.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Content-Type: application/json; Idempotency-Key: unique request key (required).
- **Request Body / Validation:** challengeId:string required; otp:string of six digits required. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** AuthSession in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 409 IDEMPOTENCY_CONFLICT. 401 INVALID_OTP or OTP_EXPIRED.
- **Frontend Consumer:** app/login.tsx; app/register.tsx.
- **Notes:** Challenge is bound to identity, purpose, device attempt context, expiry, and attempt budget. Consumed once. Password-change/reset challenges cannot mint login tokens here.

Request example:

```json
{
  "challengeId": "challenge_01",
  "otp": "482913"
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "accessToken": "example-access-token-not-valid",
    "refreshToken": "example-refresh-token-not-valid",
    "expiresAt": "2026-09-22T11:00:00Z",
    "session": {
      "id": "session_01",
      "device": "Example Android device",
      "location": "Johannesburg, ZA",
      "current": true,
      "lastSeen": "Active now",
      "lastSeenAt": "2026-09-22T10:00:00Z"
    },
    "user": {
      "id": "user_01",
      "name": "Sample Member",
      "handle": "@samplemember",
      "email": "member@example.com",
      "phone": "+27820000000",
      "avatar": "S",
      "city": "Johannesburg",
      "bio": "Exploring community spaces.",
      "communities": [],
      "savedPlaces": [],
      "verificationStatus": "unverified",
      "interests": [
        "Community",
        "Events"
      ],
      "profileSetupComplete": false
    }
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Unable to process request",
    "fields": {
      "challengeId": [
        "Invalid value"
      ]
    }
  }
}
```

### E04. POST /api/v1/auth/otp/resend

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Resend code for an existing valid challenge.
- **Authentication:** Public for register/login/password_reset challenges; password_change requires the original authenticated session as well as the opaque challenge. Determine purpose from the stored challenge.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Authorization: Bearer <access token> required for password_change only; Accept: application/json; Content-Type: application/json; Idempotency-Key: unique request key (required).
- **Request Body / Validation:** challengeId:string required. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** AuthChallenge in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 409 IDEMPOTENCY_CONFLICT. 401 OTP_EXPIRED/UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN for password-change session-binding mismatch.
- **Frontend Consumer:** app/register.tsx resend; app/change-password.tsx resend.
- **Notes:** For password_change, also require `Authorization: Bearer <access token>`; return 401 UNAUTHENTICATED/SESSION_EXPIRED for an invalid session and 403 FORBIDDEN for a session-binding mismatch. Throttle without leaking account existence; rotate/invalidate prior code and return effective challenge metadata. Preserve original purpose and destination.

Request example:

```json
{
  "challengeId": "challenge_01"
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "challengeId": "challenge_01",
    "purpose": "login",
    "delivery": "email",
    "maskedDestination": "m***@example.com",
    "expiresAt": "2026-09-22T10:10:00Z",
    "resendAfter": "2026-09-22T10:01:00Z"
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Unable to process request",
    "fields": {
      "challengeId": [
        "Invalid value"
      ]
    }
  }
}
```

### E05. POST /api/v1/auth/refresh

**Status:** PROPOSED; REQUIRED FOR PRODUCTION.

- **Purpose:** Rotate refresh credential and issue a fresh session result.
- **Authentication:** Public; refresh credential required.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Content-Type: application/json.
- **Request Body / Validation:** refreshToken:string required in proposed mobile transport. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** AuthSession in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 INVALID_CREDENTIALS or SESSION_EXPIRED.
- **Frontend Consumer:** src/store/useAppStore.ts future authenticated bootstrap; no token flow today.
- **Notes:** Mobile secure storage and web HttpOnly-cookie/CSRF adaptation require engineering approval. Never put refresh tokens in AsyncStorage/localStorage. Define refresh reuse detection and safe network retry behavior.

Request example:

```json
{
  "refreshToken": "example-refresh-token-not-valid"
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "accessToken": "example-access-token-not-valid",
    "refreshToken": "example-refresh-token-not-valid",
    "expiresAt": "2026-09-22T11:00:00Z",
    "session": {
      "id": "session_01",
      "device": "Example Android device",
      "location": "Johannesburg, ZA",
      "current": true,
      "lastSeen": "Active now",
      "lastSeenAt": "2026-09-22T10:00:00Z"
    },
    "user": {
      "id": "user_01",
      "name": "Sample Member",
      "handle": "@samplemember",
      "email": "member@example.com",
      "phone": "+27820000000",
      "avatar": "S",
      "city": "Johannesburg",
      "bio": "Exploring community spaces.",
      "communities": [],
      "savedPlaces": [],
      "verificationStatus": "unverified",
      "interests": [
        "Community",
        "Events"
      ],
      "profileSetupComplete": false
    }
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Unable to process request",
    "fields": {
      "refreshToken": [
        "Invalid value"
      ]
    }
  }
}
```

### E06. POST /api/v1/auth/logout

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Revoke current session and its refresh family.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 204.
- **Success Response schema:** No content.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** app/settings.tsx; app/(tabs)/home.tsx; AppHeader.
- **Notes:** Return 204 after revocation; remove associated push registration and clear account caches client-side. No token is silently preserved by changing only isAuthenticated.

Success: HTTP 204, zero response-body bytes.

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E07. GET /api/v1/auth/session

**Status:** PROPOSED; REQUIRED FOR PRODUCTION.

- **Purpose:** Validate bootstrap session and return owner/session metadata.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** { session: Session; user: User } in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** app/index.tsx; src/store/useAppStore.ts.
- **Notes:** Do not trust persisted isAuthenticated; a 401 leads to reauthentication.

Success example:

```json
{
  "success": true,
  "data": {
    "session": {
      "id": "session_01",
      "device": "Example Android device",
      "location": "Johannesburg, ZA",
      "current": true,
      "lastSeen": "Active now",
      "lastSeenAt": "2026-09-22T10:00:00Z"
    },
    "user": {
      "id": "user_01",
      "name": "Sample Member",
      "handle": "@samplemember",
      "email": "member@example.com",
      "phone": "+27820000000",
      "avatar": "S",
      "city": "Johannesburg",
      "bio": "Exploring community spaces.",
      "communities": [],
      "savedPlaces": [],
      "verificationStatus": "unverified",
      "interests": [
        "Community",
        "Events"
      ],
      "profileSetupComplete": false
    }
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E08. GET /api/v1/auth/sessions

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** List the owner's active sessions.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** page, limit (section 2); sort=lastSeenAt:desc only.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** Session[] in data; page/limit/total/totalPages in meta.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** app/manage-sessions.tsx.
- **Notes:** Session IDs are server identifiers, not device names.

Success example:

```json
{
  "success": true,
  "data": [
    {
      "id": "session_01",
      "device": "Example Android device",
      "location": "Johannesburg, ZA",
      "current": true,
      "lastSeen": "Active now",
      "lastSeenAt": "2026-09-22T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E09. DELETE /api/v1/auth/sessions/:id

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Revoke one owned session and its refresh credentials.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 204.
- **Success Response schema:** No content.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource. 404 NOT_FOUND for foreign/unknown session.
- **Frontend Consumer:** app/manage-sessions.tsx endSelectedSession.
- **Notes:** If revoking the caller's session, the client must leave authenticated views.

Success: HTTP 204, zero response-body bytes.

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E10. DELETE /api/v1/auth/sessions

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Revoke all the owner's sessions, including current.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 204.
- **Success Response schema:** No content.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** app/manage-sessions.tsx Sign out of all devices (currently no-op).
- **Notes:** Atomic owner scope; invalidate refresh families and notification registrations. Require recent reauthentication according to policy.

Success: HTTP 204, zero response-body bytes.

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E11. POST /api/v1/auth/change-password/challenge

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Verify current password and send a purpose-bound OTP.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>; Content-Type: application/json; Idempotency-Key: unique request key (required).
- **Request Body / Validation:** currentPassword:string required. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 201.
- **Success Response schema:** AuthChallenge in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource. 409 IDEMPOTENCY_CONFLICT. 401 INVALID_CREDENTIALS.
- **Frontend Consumer:** app/change-password.tsx handleSendOtp.
- **Notes:** New-password validation also occurs at confirmation. Do not retain plaintext passwords in challenge records.

Request example:

```json
{
  "currentPassword": "Example-Old9!"
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "challengeId": "challenge_01",
    "purpose": "password_change",
    "delivery": "email",
    "maskedDestination": "m***@example.com",
    "expiresAt": "2026-09-22T10:10:00Z",
    "resendAfter": "2026-09-22T10:01:00Z"
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E12. POST /api/v1/auth/change-password

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Verify password-change OTP and replace password.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>; Content-Type: application/json; Idempotency-Key: unique request key (required).
- **Request Body / Validation:** challengeId:string required; otp:six-digit string required; newPassword:string required. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** { changed: boolean } in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource. 409 IDEMPOTENCY_CONFLICT. 401 INVALID_OTP or OTP_EXPIRED; 422 invalid password.
- **Frontend Consumer:** app/change-password.tsx handleVerifyOtp.
- **Notes:** Apply section 3 password rules; confirmPassword remains a client-only match check. Revoke all sessions on success (proposed secure default); frontend must handle sign-in again. Further provider-specific rules require approval.

Request example:

```json
{
  "challengeId": "challenge_01",
  "otp": "482913",
  "newPassword": "Example-New9!"
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "changed": true
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E13. POST /api/v1/auth/forgot-password

**Status:** PROPOSED; PLANNED · REQUIRED FOR PRODUCTION recovery gap.

- **Purpose:** Begin enumeration-resistant recovery.
- **Authentication:** Public.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Content-Type: application/json; Idempotency-Key: unique request key (required).
- **Request Body / Validation:** email:string required. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 201.
- **Success Response schema:** AuthChallenge in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 409 IDEMPOTENCY_CONFLICT.
- **Frontend Consumer:** app/login.tsx Forgot password routes to change-password, which incorrectly requires current password.
- **Notes:** Recovery UX is not complete. Return indistinguishable challenge-shaped acknowledgement for unknown accounts without sending mail; never return a reset secret/OTP in the body.

Request example:

```json
{
  "email": "member@example.com"
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "challengeId": "challenge_01",
    "purpose": "password_reset",
    "delivery": "email",
    "maskedDestination": "m***@example.com",
    "expiresAt": "2026-09-22T10:10:00Z",
    "resendAfter": "2026-09-22T10:01:00Z"
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Unable to process request",
    "fields": {
      "email": [
        "Invalid value"
      ]
    }
  }
}
```

### E14. POST /api/v1/auth/reset-password

**Status:** PROPOSED; PLANNED · REQUIRED FOR PRODUCTION recovery gap.

- **Purpose:** Complete recovery and revoke existing sessions.
- **Authentication:** Public; recovery challenge required.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Content-Type: application/json; Idempotency-Key: unique request key (required).
- **Request Body / Validation:** challengeId:string required; otp:six-digit string required; newPassword:string required. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** { changed: boolean } in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 409 IDEMPOTENCY_CONFLICT. 401 INVALID_OTP or OTP_EXPIRED.
- **Frontend Consumer:** Future recovery integration from login; not a complete current form.
- **Notes:** Consume recovery challenge only, apply approved password policy, revoke all sessions and require login. Replaces draft password-reset/confirm; not an additional endpoint alias.

Request example:

```json
{
  "challengeId": "challenge_01",
  "otp": "482913",
  "newPassword": "Example-New9!"
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "changed": true
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Unable to process request",
    "fields": {
      "challengeId": [
        "Invalid value"
      ]
    }
  }
}
```

### E15. GET /api/v1/users/me

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Fetch private owner profile.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** User in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** app/settings.tsx; profile/home; AppHeader; setup.
- **Notes:** No other user's private User representation is exposed.

Success example:

```json
{
  "success": true,
  "data": {
    "id": "user_01",
    "name": "Sample Member",
    "handle": "@samplemember",
    "email": "member@example.com",
    "phone": "+27820000000",
    "avatar": "S",
    "city": "Johannesburg",
    "bio": "Exploring community spaces.",
    "communities": [],
    "savedPlaces": [],
    "verificationStatus": "unverified",
    "interests": [
      "Community",
      "Events"
    ],
    "profileSetupComplete": false
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E16. PATCH /api/v1/users/me

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Persist profile edits and setup fields.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>; Content-Type: application/json.
- **Request Body / Validation:** Optional fields: name:string, email:string, phone:E.164 string, handle:string, city:string, bio:string, interests:allowed string[], profileImageId:string or null, profileSetupComplete:boolean. Require at least one. Reject writes outside this allowlist. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** User in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN/VERIFICATION_REQUIRED; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** app/settings.tsx; app/profile-setup.tsx.
- **Notes:** Email/phone changes must enter re-verification, preserving active verified values until completed; challenge/UX approval is required before enabling those two writes. Until then, reject those writes with 403 VERIFICATION_REQUIRED. Verification fields, savedPlaces, communities, and id are read-only. profileImageId must reference an owned, completed profile_photo upload; null clears the image and omits profileImageUrl in the response. Setup completion validates nonempty city/interests and valid saved contacts/photo only under an approved mandatory-step policy; the mock step criteria conflict.

Request example:

```json
{
  "name": "Sample Member",
  "city": "Johannesburg",
  "interests": [
    "Community",
    "Events"
  ]
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "id": "user_01",
    "name": "Sample Member",
    "handle": "@samplemember",
    "email": "member@example.com",
    "phone": "+27820000000",
    "avatar": "S",
    "city": "Johannesburg",
    "bio": "Exploring community spaces.",
    "communities": [],
    "savedPlaces": [],
    "verificationStatus": "unverified",
    "interests": [
      "Community",
      "Events"
    ],
    "profileSetupComplete": false
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E17. POST /api/v1/users/me/deactivate

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Deactivate account and revoke sessions after reauthentication.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>; Content-Type: application/json; Idempotency-Key: unique request key (required).
- **Request Body / Validation:** password:string required. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** { deactivated: boolean } in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource. 409 IDEMPOTENCY_CONFLICT. 401 INVALID_CREDENTIALS.
- **Frontend Consumer:** app/settings.tsx confirmDeactivation.
- **Notes:** UI promises reactivation within 365 days; this is product text, not approved retention. Retention, recovery, expiry, and post-window deletion policy must be agreed. Do not equate deactivation with deletion.

Request example:

```json
{
  "password": "Example-Only9!"
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "deactivated": true
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E18. DELETE /api/v1/users/me

**Status:** PROPOSED; PLANNED · privacy lifecycle, no current deletion control.

- **Purpose:** Delete account under the approved privacy policy.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>; Content-Type: application/json.
- **Request Body / Validation:** password:string required in proposed JSON request for recent reauthentication. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 204.
- **Success Response schema:** No content.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource. 401 INVALID_CREDENTIALS.
- **Frontend Consumer:** No current delete-account UI; distinct from deactivation.
- **Notes:** No account-deletion screen exists. Release the operation only with legal/product policy for backups, retention exceptions, shared posts, media, and confirmation. 204 means completed user-facing deletion; asynchronous workflows require a separately agreed status contract.

Request example:

```json
{
  "password": "Example-Only9!"
}
```

Success: HTTP 204, zero response-body bytes.

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E19. GET /api/v1/users/me/settings

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Read canonical cross-device preferences.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** UserSettings in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** app/settings.tsx; app/privacy-settings.tsx; setup shareLocation.
- **Notes:** Theme, expanded sections, selected tabs, drafts, and OS permissions remain device-local.

Success example:

```json
{
  "success": true,
  "data": {
    "pushNotifications": false,
    "mutePushNotifications": false,
    "pushNewEvent": false,
    "pushCommunityReview": false,
    "emailNotifications": false,
    "muteEmailNotifications": false,
    "emailNewEvent": false,
    "emailCommunityReview": false,
    "twoFactorEnabled": false,
    "loginAlerts": true,
    "profileVisible": false,
    "shareLocation": false,
    "showLocation": false,
    "allowMessages": false,
    "dataSharing": false
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E20. PATCH /api/v1/users/me/settings

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Update notification/privacy/security preferences.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>; Content-Type: application/json.
- **Request Body / Validation:** Any UserSettings field except twoFactorEnabled is optional boolean; require at least one. twoFactorEnabled changes are rejected pending verified enrollment protocol. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** UserSettings in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource. 403 VERIFICATION_REQUIRED for an attempted two-factor change; 422 contradictory/unknown fields.
- **Frontend Consumer:** settings.tsx; privacy-settings.tsx; useAppStore shareLocation.
- **Notes:** Mute suppresses delivery even if category enabled; master off suppresses its categories. Turning shareLocation off revokes active server shares immediately. It cannot unsend an SMS or erase recipient screenshots. Profile visibility must be enforced by server responses. Conflicting UI toggles converge on one stored value.

Request example:

```json
{
  "profileVisible": false,
  "shareLocation": false,
  "showLocation": false
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "pushNotifications": false,
    "mutePushNotifications": false,
    "pushNewEvent": false,
    "pushCommunityReview": false,
    "emailNotifications": false,
    "muteEmailNotifications": false,
    "emailNewEvent": false,
    "emailCommunityReview": false,
    "twoFactorEnabled": false,
    "loginAlerts": true,
    "profileVisible": false,
    "shareLocation": false,
    "showLocation": false,
    "allowMessages": false,
    "dataSharing": false
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E21. POST /api/v1/media/upload

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Upload a profile photo or private verification selfie.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>; Content-Type: multipart/form-data; boundary set by the client; Idempotency-Key: unique request key (required).
- **Request Body / Validation:** multipart/form-data: file:binary required; kind:profile_photo|verification_selfie required. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 201.
- **Success Response schema:** Media in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource. 409 IDEMPOTENCY_CONFLICT. 413 MEDIA_TOO_LARGE; 415 UNSUPPORTED_MEDIA_TYPE; 422 invalid decoded image.
- **Frontend Consumer:** app/settings.tsx image library/camera/web picker; setup photo integration.
- **Notes:** Authenticated multipart upload is the proposed simple strategy; no storage credentials reach the app. MIME allowlist and byte/pixel limits are ENGINEERING DECISION REQUIRED. Sniff/decode real content, strip EXIF/GPS, scan, and enforce quotas. Reject active SVG content unless safely transformed under an approved policy. Verification media returns url:null and must remain private.

Multipart request example (binary payload is uploaded from the selected local file, not a JSON filename):

```sh
curl -X POST https://api.example.com/api/v1/media/upload \
  -H 'Authorization: Bearer example-access-token-not-valid' \
  -H 'Idempotency-Key: example-upload-01' \
  -F 'kind=profile_photo' \
  -F 'file=@profile.jpg;type=image/jpeg'
```

Success example:

```json
{
  "success": true,
  "data": {
    "id": "media_01",
    "kind": "profile_photo",
    "mimeType": "image/jpeg",
    "sizeBytes": 120000,
    "url": "https://media.example.com/profile_01.jpg",
    "width": 512,
    "height": 512,
    "createdAt": "2026-09-22T10:00:00Z"
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E22. GET /api/v1/media/:id

**Status:** PROPOSED; PLANNED / OPTIONAL · not currently wired.

- **Purpose:** Read owned uploaded image metadata.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** Media in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** Upload integration; draft metadata read not currently wired.
- **Notes:** Only owner; URL null for verification media. Current profile reads do not require a separate metadata call.

Success example:

```json
{
  "success": true,
  "data": {
    "id": "media_01",
    "kind": "profile_photo",
    "mimeType": "image/jpeg",
    "sizeBytes": 120000,
    "url": "https://media.example.com/profile_01.jpg",
    "width": 512,
    "height": 512,
    "createdAt": "2026-09-22T10:00:00Z"
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E23. DELETE /api/v1/media/:id

**Status:** PROPOSED; PROPOSED · upload lifecycle hygiene.

- **Purpose:** Delete an owned unattached/replaced image.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 204.
- **Success Response schema:** No content.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource. 409 CONFLICT while referenced.
- **Frontend Consumer:** Profile-photo replacement integration; no current standalone delete button.
- **Notes:** Reject deletion while actively referenced unless profile is first detached; erase storage according to policy and preserve only justified audit metadata.

Success: HTTP 204, zero response-body bytes.

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E24. POST /api/v1/users/me/selfie-verifications

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Submit private selfie for actual verification.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>; Content-Type: application/json; Idempotency-Key: unique request key (required).
- **Request Body / Validation:** mediaId:string required, owned completed verification_selfie upload. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 201.
- **Success Response schema:** SelfieVerification in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource. 409 IDEMPOTENCY_CONFLICT.
- **Frontend Consumer:** app/settings.tsx handleSelfieVerification.
- **Notes:** Verification method, liveness requirements, biometric processing basis, retention, and reviewer access require product/security approval. Never treat uploaded photo or elapsed timer as proof of identity.

Request example:

```json
{
  "mediaId": "media_selfie_01"
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "id": "verification_01",
    "status": "pending",
    "createdAt": "2026-09-22T10:00:00Z",
    "completedAt": null
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E25. GET /api/v1/users/me/selfie-verifications/:id

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Read server verification status.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** SelfieVerification in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** app/settings.tsx verifying/success modal.
- **Notes:** Poll/backoff cadence is an engineering decision; show pending/rejected honestly. Result is session identity only unless product approves a broader badge.

Success example:

```json
{
  "success": true,
  "data": {
    "id": "verification_01",
    "status": "pending",
    "createdAt": "2026-09-22T10:00:00Z",
    "completedAt": null
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E26. GET /api/v1/places

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** List/search/filter places and provide nearby results.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** page, limit; search:string optional; category:PlaceCategory optional; city:string optional; latitude:number and longitude:number supplied together; radiusKm:positive number requires both coordinates; sort=name:asc|distance:asc (distance requires origin). Proposed default name:asc without origin, distance:asc with origin.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** Place[] in data; page/limit/total/totalPages in meta.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** home.tsx; explore.tsx; route.tsx; NearbyCard.
- **Notes:** Nearby is folded into this endpoint; no duplicate /places/nearby is needed. Search name/city/category/address/description. Route UI's 3.5 km default is a client selection, not a global service radius. Never derive an origin silently.

Success example:

```json
{
  "success": true,
  "data": [
    {
      "id": "place_01",
      "name": "Example Community Cafe",
      "city": "Johannesburg",
      "category": "eat",
      "address": "Example Street, Johannesburg",
      "distance": "1.2 km",
      "rating": 0,
      "reviewCount": 0,
      "verifications": [],
      "description": "A fictional example venue.",
      "hours": "Mon–Fri 09:00–17:00",
      "imageUrl": "https://media.example.com/cafe.jpg",
      "coords": {
        "latitude": -26.1952,
        "longitude": 28.0341
      },
      "safetyScore": 75,
      "reviews": []
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E27. GET /api/v1/places/:id

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Read one place.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** latitude and longitude optional pair for contextual distance; no radius or pagination.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** Place in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** app/places/[id].tsx; PlaceMapSheet.
- **Notes:** Return 404 for missing ID; do not reproduce the current fallback to the first mock place. No place phone/contact field is consumed; do not invent it.

Success example:

```json
{
  "success": true,
  "data": {
    "id": "place_01",
    "name": "Example Community Cafe",
    "city": "Johannesburg",
    "category": "eat",
    "address": "Example Street, Johannesburg",
    "distance": "1.2 km",
    "rating": 0,
    "reviewCount": 0,
    "verifications": [],
    "description": "A fictional example venue.",
    "hours": "Mon–Fri 09:00–17:00",
    "imageUrl": "https://media.example.com/cafe.jpg",
    "coords": {
      "latitude": -26.1952,
      "longitude": 28.0341
    },
    "safetyScore": 75,
    "reviews": []
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E28. GET /api/v1/places/categories

**Status:** PROPOSED; PROPOSED · OPTIONAL remote taxonomy.

- **Purpose:** Expose existing category enum/labels.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** page, limit; sort=value:asc only.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** Category[] in data; page/limit/total/totalPages in meta.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** route.tsx category controls; static list may remain local.
- **Notes:** No category administration UI; same enum as section 3.

Success example:

```json
{
  "success": true,
  "data": [
    {
      "value": "eat",
      "label": "Eat"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E29. GET /api/v1/users/me/saved-places

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Read persistent saved places.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** page, limit; sort=name:asc only.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** Place[] in data; page/limit/total/totalPages in meta.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** profile.tsx Saved; home.tsx saved toggles.
- **Notes:** Unifies local Home/Route saved arrays and MOCK_USER.savedPlaces. Explore currently passes a no-op save handler.

Success example:

```json
{
  "success": true,
  "data": [
    {
      "id": "place_01",
      "name": "Example Community Cafe",
      "city": "Johannesburg",
      "category": "eat",
      "address": "Example Street, Johannesburg",
      "distance": "1.2 km",
      "rating": 0,
      "reviewCount": 0,
      "verifications": [],
      "description": "A fictional example venue.",
      "hours": "Mon–Fri 09:00–17:00",
      "imageUrl": "https://media.example.com/cafe.jpg",
      "coords": {
        "latitude": -26.1952,
        "longitude": 28.0341
      },
      "safetyScore": 75,
      "reviews": []
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E30. PUT /api/v1/users/me/saved-places/:id

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Save a place idempotently.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** { placeId: string; saved: boolean } in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** home.tsx NearbyCard; route.tsx bookmark toggle.
- **Notes:** Path id is a Place ID. Saving is distinct from adding a route waypoint; the route Save location action currently does both locally.

Success example:

```json
{
  "success": true,
  "data": {
    "placeId": "place_01",
    "saved": true
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E31. DELETE /api/v1/users/me/saved-places/:id

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Remove a saved-place membership.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 204.
- **Success Response schema:** No content.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** home.tsx and route.tsx bookmark toggle.
- **Notes:** Path id is a Place ID. Does not delete the place or alter existing route stops.

Success: HTTP 204, zero response-body bytes.

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E32. GET /api/v1/places/:id/reviews

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Read complete paginated reviews.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** page, limit; sort=createdAt:desc only.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** Review[] in data; page/limit/total/totalPages in meta.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** app/places/[id].tsx; ReviewSection.
- **Notes:** Use authoritative Place.reviewCount/rating rather than loaded-page length.

Success example:

```json
{
  "success": true,
  "data": [
    {
      "id": "review_01",
      "user": "Sample Member",
      "avatar": "S",
      "rating": 5,
      "headline": "Welcoming space",
      "comment": "Friendly staff and clear access information.",
      "timeAgo": "just now",
      "authorId": "user_01",
      "createdAt": "2026-09-22T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E33. POST /api/v1/places/:id/reviews

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Create the owner's review for a place.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>; Content-Type: application/json; Idempotency-Key: unique request key (required).
- **Request Body / Validation:** rating:integer 1–5 required; comment:trimmed nonempty string required; headline:string optional, blank defaults to My experience. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 201.
- **Success Response schema:** Review in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource. 409 IDEMPOTENCY_CONFLICT.
- **Frontend Consumer:** ReviewSection; useAppStore.addReview.
- **Notes:** Derive author from session; update aggregates transactionally. One-review-per-user versus multiple is ENGINEERING DECISION REQUIRED. Edit/delete review controls are absent.

Request example:

```json
{
  "rating": 5,
  "headline": "Welcoming space",
  "comment": "Friendly staff and clear access information."
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "id": "review_01",
    "user": "Sample Member",
    "avatar": "S",
    "rating": 5,
    "headline": "Welcoming space",
    "comment": "Friendly staff and clear access information.",
    "timeAgo": "just now",
    "authorId": "user_01",
    "createdAt": "2026-09-22T10:00:00Z"
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E34. GET /api/v1/events

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** List and search events.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** page, limit; search:string optional; type:EventType optional (taxonomy exists, filter control not currently wired); featured:boolean optional (proposed Home selection); sort=date:asc only, using internal normalized event schedule.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** Event[] in data; page/limit/total/totalPages in meta.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** home.tsx first-three upcoming cards; explore.tsx events.
- **Notes:** Search title/venue/address/description/tags. No event save, ticket purchase, or management UI. Featured means a proposed curated filter, not an existing Boolean field.

Success example:

```json
{
  "success": true,
  "data": [
    {
      "id": "event_01",
      "title": "Community gathering",
      "type": "community",
      "date": "1 October 2026",
      "time": "18:00",
      "venue": "Example Hall",
      "address": "Example Street, Johannesburg",
      "price": "Free",
      "attendees": 0,
      "imageUrl": "https://media.example.com/event.jpg",
      "organiser": "Example Community",
      "description": "An illustrative community gathering.",
      "tags": [
        "community"
      ],
      "rating": 0,
      "reviewCount": 0,
      "reviews": []
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E35. GET /api/v1/events/:id

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Read event details.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** Event in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** app/events/[id].tsx.
- **Notes:** 404 for unknown ID rather than first mock fallback. Price is display-only; schedule timezone must be agreed.

Success example:

```json
{
  "success": true,
  "data": {
    "id": "event_01",
    "title": "Community gathering",
    "type": "community",
    "date": "1 October 2026",
    "time": "18:00",
    "venue": "Example Hall",
    "address": "Example Street, Johannesburg",
    "price": "Free",
    "attendees": 0,
    "imageUrl": "https://media.example.com/event.jpg",
    "organiser": "Example Community",
    "description": "An illustrative community gathering.",
    "tags": [
      "community"
    ],
    "rating": 0,
    "reviewCount": 0,
    "reviews": []
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E36. POST /api/v1/events/:id/register

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Persist attendance registration.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>; Content-Type: application/json; Idempotency-Key: unique request key (required).
- **Request Body / Validation:** name:string required; email:string required; phone:E.164 string required. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 201.
- **Success Response schema:** EventRegistration in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource. 409 IDEMPOTENCY_CONFLICT. 409 CONFLICT for an already registered user under approved uniqueness policy.
- **Frontend Consumer:** app/events/[id].tsx registration form.
- **Notes:** Require syntax validation in addition to UI nonempty checks. Idempotent retries must not increase attendee counts twice. Capacity, cancellation, paid ticketing, and duplicate registration rules remain open; no cancellation endpoint is implied.

Request example:

```json
{
  "name": "Sample Member",
  "email": "member@example.com",
  "phone": "+27820000000"
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "id": "registration_01",
    "eventId": "event_01",
    "name": "Sample Member",
    "email": "member@example.com",
    "phone": "+27820000000",
    "createdAt": "2026-09-22T10:00:00Z"
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E37. GET /api/v1/events/:id/reviews

**Status:** PROPOSED; PLANNED / OPTIONAL · not currently wired.

- **Purpose:** Read event reviews represented in types/draft.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** page, limit; sort=createdAt:desc only.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** Review[] in data; page/limit/total/totalPages in meta.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** Event.reviews mock/type; current event detail does not render reviews.
- **Notes:** Retained draft intent; implement only when event review UI is approved.

Success example:

```json
{
  "success": true,
  "data": [
    {
      "id": "review_01",
      "user": "Sample Member",
      "avatar": "S",
      "rating": 5,
      "headline": "Welcoming space",
      "comment": "Friendly staff and clear access information.",
      "timeAgo": "just now",
      "authorId": "user_01",
      "createdAt": "2026-09-22T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E38. POST /api/v1/events/:id/reviews

**Status:** PROPOSED; PLANNED / OPTIONAL · not currently wired.

- **Purpose:** Persist an event review if the planned form is enabled.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>; Content-Type: application/json; Idempotency-Key: unique request key (required).
- **Request Body / Validation:** rating:integer 1–5 required; comment:nonempty string required; headline:string optional. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 201.
- **Success Response schema:** Review in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource. 409 IDEMPOTENCY_CONFLICT.
- **Frontend Consumer:** useAppStore supports event target; no current event form.
- **Notes:** Use the same author and aggregate rules as place reviews; this is not required to preserve today's event detail.

Request example:

```json
{
  "rating": 5,
  "headline": "Good gathering",
  "comment": "A welcoming event."
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "id": "review_01",
    "user": "Sample Member",
    "avatar": "S",
    "rating": 5,
    "headline": "Good gathering",
    "comment": "A welcoming event.",
    "timeAgo": "just now",
    "authorId": "user_01",
    "createdAt": "2026-09-22T10:00:00Z"
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E39. GET /api/v1/directory/resources

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Search/filter the community service directory.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** page, limit; search:string optional; category:exact Directory category label optional; city:string optional; sort=name:asc only.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** DirectoryResource[] in data; page/limit/total/totalPages in meta.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** app/directory.tsx; src/data/directoryData.ts.
- **Notes:** Search name/category/city/area/description. Directory entries have no geographic coordinates; do not fabricate distance queries. No create/edit directory UI.

Success example:

```json
{
  "success": true,
  "data": [
    {
      "id": "directory_01",
      "name": "Example Support Centre",
      "category": "Support groups",
      "city": "Johannesburg",
      "area": "Example Area",
      "description": "Fictional peer support listing.",
      "detail": "Bookings required",
      "badge": "Community resource"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E40. GET /api/v1/directory/categories

**Status:** PROPOSED; PROPOSED · OPTIONAL remote taxonomy.

- **Purpose:** Expose the existing service category labels.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** page, limit; sort=label:asc only.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** Category[] in data; page/limit/total/totalPages in meta.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** app/directory.tsx category chips.
- **Notes:** All remains a client-side no-filter option.

Success example:

```json
{
  "success": true,
  "data": [
    {
      "value": "Support groups",
      "label": "Support groups"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E41. GET /api/v1/community/feed

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Read community posts.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** page, limit; city:string optional; sort=createdAt:desc only.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** CommunityPost[] in data; page/limit/total/totalPages in meta.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** app/(tabs)/community.tsx; home.tsx community card.
- **Notes:** City chips currently do not actually filter the in-memory posts; backend filtering is the intended replacement. No global/community text search requirement is established.

Success example:

```json
{
  "success": true,
  "data": [
    {
      "id": "post_01",
      "author": "Sample Member",
      "avatar": "S",
      "handle": "@samplemember",
      "content": "Looking forward to the community gathering.",
      "likes": 0,
      "comments": 0,
      "shares": 0,
      "timeAgo": "just now",
      "city": "Johannesburg",
      "tags": [],
      "authorId": "user_01",
      "createdAt": "2026-09-22T10:00:00Z",
      "likedByMe": false
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E42. POST /api/v1/community/posts

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Create a text community post.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>; Content-Type: application/json; Idempotency-Key: unique request key (required).
- **Request Body / Validation:** content:nonempty string required; city:string required (current city chip). Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 201.
- **Success Response schema:** CommunityPost in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource. 409 IDEMPOTENCY_CONFLICT.
- **Frontend Consumer:** community.tsx publishPost.
- **Notes:** Session supplies author. The composer has no attachment picker, tag entry, visibility selector, or edit/delete controls. City allowlist initially matches Cape Town/Johannesburg/Durban/Pretoria; wider geography requires approval.

Request example:

```json
{
  "content": "Looking forward to the community gathering.",
  "city": "Johannesburg"
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "id": "post_01",
    "author": "Sample Member",
    "avatar": "S",
    "handle": "@samplemember",
    "content": "Looking forward to the community gathering.",
    "likes": 0,
    "comments": 0,
    "shares": 0,
    "timeAgo": "just now",
    "city": "Johannesburg",
    "tags": [],
    "authorId": "user_01",
    "createdAt": "2026-09-22T10:00:00Z",
    "likedByMe": false
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E43. GET /api/v1/community/posts/:id

**Status:** PROPOSED; PLANNED / OPTIONAL · not currently wired.

- **Purpose:** Read a post for a future durable share/detail destination.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** CommunityPost in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** Draft post-detail requirement; no current post detail route.
- **Notes:** Preserves draft intent; current share URL is generic /community, not an individual post. Visibility rules still apply.

Success example:

```json
{
  "success": true,
  "data": {
    "id": "post_01",
    "author": "Sample Member",
    "avatar": "S",
    "handle": "@samplemember",
    "content": "Looking forward to the community gathering.",
    "likes": 0,
    "comments": 0,
    "shares": 0,
    "timeAgo": "just now",
    "city": "Johannesburg",
    "tags": [],
    "authorId": "user_01",
    "createdAt": "2026-09-22T10:00:00Z",
    "likedByMe": false
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E44. GET /api/v1/community/posts/:id/comments

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Read persistent comments.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** page, limit; sort=createdAt:asc only.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** Comment[] in data; page/limit/total/totalPages in meta.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** home.tsx local comments; community.tsx comment count/composer.
- **Notes:** Community has no current comment thread rendering; integration must add response handling later without assuming the count-only mock is storage.

Success example:

```json
{
  "success": true,
  "data": [
    {
      "id": "comment_01",
      "postId": "post_01",
      "author": "Sample Member",
      "text": "Thank you for sharing.",
      "authorId": "user_01",
      "createdAt": "2026-09-22T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E45. POST /api/v1/community/posts/:id/comments

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Persist a comment and update count.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>; Content-Type: application/json; Idempotency-Key: unique request key (required).
- **Request Body / Validation:** text:trimmed nonempty string required. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 201.
- **Success Response schema:** Comment in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource. 409 IDEMPOTENCY_CONFLICT.
- **Frontend Consumer:** home.tsx addComment; community.tsx handleComment.
- **Notes:** Home's hard-coded story must first resolve to a real post ID. Unknown ID must not be guessed.

Request example:

```json
{
  "text": "Thank you for sharing."
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "id": "comment_01",
    "postId": "post_01",
    "author": "Sample Member",
    "text": "Thank you for sharing.",
    "authorId": "user_01",
    "createdAt": "2026-09-22T10:00:00Z"
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E46. POST /api/v1/community/posts/:id/reactions

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Set the caller's like once.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>; Content-Type: application/json.
- **Request Body / Validation:** reaction:string required, only like. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** { postId: string; likedByMe: boolean; likes: number } in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** community.tsx like toggle.
- **Notes:** Enforce unique user/post like; repeated likes return 200 current state, not an extra count. No other reaction types exposed.

Request example:

```json
{
  "reaction": "like"
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "postId": "post_01",
    "likedByMe": true,
    "likes": 1
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E47. DELETE /api/v1/community/posts/:id/reactions

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Remove the caller's like idempotently.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 204.
- **Success Response schema:** No content.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** community.tsx unlike toggle.
- **Notes:** Only caller's reaction is removed; refetch/update authoritative count.

Success: HTTP 204, zero response-body bytes.

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E48. GET /api/v1/campaigns/featured

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Read current featured campaign.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** Campaign or null when no featured campaign in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** CircleOfLoveCard on Home.
- **Notes:** 200 data:null means no featured campaign; client must hide the card. Current single hard-coded campaign is not evidence of a campaign administration API.

Success example:

```json
{
  "success": true,
  "data": {
    "id": "campaign_01",
    "title": "Circle of Love",
    "host": "Initiated by Thami Dish",
    "date": "1 October 2026",
    "location": "Johannesburg, South Africa",
    "image": "https://media.example.com/campaign.jpg",
    "tags": [
      "Community"
    ],
    "metrics": [
      {
        "label": "Goal",
        "value": "Celebrate love"
      }
    ]
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E49. GET /api/v1/campaigns

**Status:** PROPOSED; PLANNED / OPTIONAL · not currently wired.

- **Purpose:** Read campaign catalogue retained from draft.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** page, limit; sort=date:asc only.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** Campaign[] in data; page/limit/total/totalPages in meta.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** No current catalogue screen; CircleOfLoveCard only.
- **Notes:** Do not build campaign creation/edit APIs without an administration requirement.

Success example:

```json
{
  "success": true,
  "data": [
    {
      "id": "campaign_01",
      "title": "Circle of Love",
      "host": "Initiated by Thami Dish",
      "date": "1 October 2026",
      "location": "Johannesburg, South Africa",
      "image": "https://media.example.com/campaign.jpg",
      "tags": [
        "Community"
      ],
      "metrics": [
        {
          "label": "Goal",
          "value": "Celebrate love"
        }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E50. GET /api/v1/campaigns/:id

**Status:** PROPOSED; PLANNED / OPTIONAL · not currently wired.

- **Purpose:** Read a campaign by ID.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** Campaign in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** Draft detail requirement; current RSVP opens in the card.
- **Notes:** Canonical future share destination needs a real frontend route and approved hostname.

Success example:

```json
{
  "success": true,
  "data": {
    "id": "campaign_01",
    "title": "Circle of Love",
    "host": "Initiated by Thami Dish",
    "date": "1 October 2026",
    "location": "Johannesburg, South Africa",
    "image": "https://media.example.com/campaign.jpg",
    "tags": [
      "Community"
    ],
    "metrics": [
      {
        "label": "Goal",
        "value": "Celebrate love"
      }
    ]
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E51. POST /api/v1/campaigns/:id/rsvp

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Register campaign participation interest.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>; Content-Type: application/json; Idempotency-Key: unique request key (required).
- **Request Body / Validation:** fullName:string required; email:string required; phone:E.164 string required; role:ParticipationRole required; message:string optional, defaults empty. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 201.
- **Success Response schema:** CampaignRsvp in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource. 409 IDEMPOTENCY_CONFLICT. 409 CONFLICT if duplicate registration is disallowed by approved policy.
- **Frontend Consumer:** CircleOfLoveCard RsvpForm.
- **Notes:** Store message as potentially sensitive accessibility information, visible only to authorized organizers. No marriage/identity certification or payment guarantee. Replace setTimeout success only after actual receipt.

Request example:

```json
{
  "fullName": "Sample Member",
  "email": "member@example.com",
  "phone": "+27820000000",
  "role": "Guest / Supporter",
  "message": ""
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "id": "rsvp_01",
    "campaignId": "campaign_01",
    "fullName": "Sample Member",
    "email": "member@example.com",
    "phone": "+27820000000",
    "role": "Guest / Supporter",
    "message": "",
    "createdAt": "2026-09-22T10:00:00Z"
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E52. GET /api/v1/trusted-contacts

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Read owner's emergency/trusted contacts.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** page, limit; sort=name:asc only; owner total cannot exceed five.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** EmergencyContact[] in data; page/limit/total/totalPages in meta.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** emergency-contacts.tsx; route.tsx; setup integration.
- **Notes:** Single canonical resource; draft /safety/contacts is consolidated here. No full device address-book upload.

Success example:

```json
{
  "success": true,
  "data": [
    {
      "id": "contact_01",
      "name": "Example Trusted Contact",
      "phone": "+27820000001",
      "relationship": "Friend",
      "isVerified": false,
      "canReceiveSms": true,
      "canReceiveCall": false,
      "shareLiveLocation": false
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E53. POST /api/v1/trusted-contacts

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Add a manually entered or selected contact.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>; Content-Type: application/json; Idempotency-Key: unique request key (required).
- **Request Body / Validation:** name:string required; phone:E.164 string required; relationship:string optional defaults Friend; canReceiveSms:boolean optional defaults true; canReceiveCall:boolean optional defaults false; shareLiveLocation:boolean optional defaults false. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 201.
- **Success Response schema:** EmergencyContact in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource. 409 IDEMPOTENCY_CONFLICT. 409 CONTACT_LIMIT_REACHED or DUPLICATE_CONTACT.
- **Frontend Consumer:** emergency-contacts.tsx; profile-setup.tsx contacts.
- **Notes:** Atomic five-contact cap, normalize and deduplicate by owner/phone. isVerified is server-only false initially. Consent/invite delivery/acceptance mechanism is unresolved and cannot be assumed to occur.

Request example:

```json
{
  "name": "Example Trusted Contact",
  "phone": "+27820000001",
  "relationship": "Friend",
  "canReceiveSms": true,
  "canReceiveCall": false,
  "shareLiveLocation": false
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "id": "contact_01",
    "name": "Example Trusted Contact",
    "phone": "+27820000001",
    "relationship": "Friend",
    "isVerified": false,
    "canReceiveSms": true,
    "canReceiveCall": false,
    "shareLiveLocation": false
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E54. PATCH /api/v1/trusted-contacts/:id

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Change contact details/preferences.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>; Content-Type: application/json.
- **Request Body / Validation:** Optional: name:string, phone:E.164 string, relationship:string, canReceiveSms:boolean, canReceiveCall:boolean, shareLiveLocation:boolean. At least one; isVerified/id forbidden. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** EmergencyContact in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource. 409 DUPLICATE_CONTACT.
- **Frontend Consumer:** emergency-contacts.tsx switches; store updateContact.
- **Notes:** Phone change invalidates existing verification and grants. Revoking share preference removes this recipient from active location ACLs. Consent is not established by owner toggling permission.

Request example:

```json
{
  "canReceiveCall": true
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "id": "contact_01",
    "name": "Example Trusted Contact",
    "phone": "+27820000001",
    "relationship": "Friend",
    "isVerified": false,
    "canReceiveSms": true,
    "canReceiveCall": true,
    "shareLiveLocation": false
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E55. DELETE /api/v1/trusted-contacts/:id

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Remove owned contact and revoke its active grants.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 204.
- **Success Response schema:** No content.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** emergency-contacts.tsx removeContact.
- **Notes:** Do not leave recipients authorized after deletion. Local store currently restores demo contacts when persisted array is empty; fix in future integration.

Success: HTTP 204, zero response-body bytes.

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E56. GET /api/v1/safety/resources

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Read curated emergency/legal/crisis support information.
- **Authentication:** Public.
- **Path Parameters:** None.
- **Query Parameters:** page, limit; resourceType:ResourceType optional; sort=title:asc only.
- **Request Headers:** Accept: application/json.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** SafetyResource[] in data; page/limit/total/totalPages in meta.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE.
- **Frontend Consumer:** app/safety.tsx.
- **Notes:** Public read proposed to avoid requiring login for help; no private data. Verify real numbers and links, content ownership, and freshness. tel:112 remains a device dialer action, not this API.

Success example:

```json
{
  "success": true,
  "data": [
    {
      "id": "resource_01",
      "title": "Example support directory",
      "description": "Illustrative resource; not a real emergency service.",
      "websiteUrl": "https://example.com/support",
      "resourceType": "crisis"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Unable to process request",
    "fields": {}
  }
}
```

### E57. GET /api/v1/notifications

**Status:** PROPOSED; REQUIRED · current behavior MOCKED.

- **Purpose:** Read owner in-app notifications.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** page, limit; unread:boolean optional; sort=createdAt:desc only.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** Notification[] in data; page/limit/total/totalPages plus required unreadCount (nonnegative integer) in meta. unreadCount covers all unread notifications owned by the caller, independent of filters and pagination.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** home.tsx initialNotifications; AppHeader badge.
- **Notes:** Badge should use server unreadCount rather than hard-coded 3. Message contents must not disclose sensitive data on lock screens.

Success example:

```json
{
  "success": true,
  "data": [
    {
      "id": "notification_01",
      "title": "New community post",
      "detail": "A new update is available.",
      "time": "just now",
      "createdAt": "2026-09-22T10:00:00Z",
      "read": false
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "unreadCount": 1
  }
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E58. PATCH /api/v1/notifications/:id/read

**Status:** PROPOSED; PLANNED / OPTIONAL · not currently wired.

- **Purpose:** Mark one owned notification read.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>; Content-Type: application/json.
- **Request Body / Validation:** read:boolean required; only true accepted. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** Notification in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** Draft read-state intent; no current wired read mutation.
- **Notes:** Current modal is mostly presentation; do not describe this as an existing frontend request.

Request example:

```json
{
  "read": true
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "id": "notification_01",
    "title": "New community post",
    "detail": "A new update is available.",
    "time": "just now",
    "createdAt": "2026-09-22T10:00:00Z",
    "read": true
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E59. PATCH /api/v1/notifications/read-all

**Status:** PROPOSED; PLANNED / OPTIONAL · not currently wired.

- **Purpose:** Mark current owner's existing notifications read.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** { updatedCount: number } in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** Draft read-all intent.
- **Notes:** Only records existing at server operation time; future notifications remain unread.

Success example:

```json
{
  "success": true,
  "data": {
    "updatedCount": 1
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E60. POST /api/v1/devices

**Status:** PROPOSED; PLANNED · REQUIRED if push settings are delivered.

- **Purpose:** Register a push installation to the current user.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>; Content-Type: application/json; Idempotency-Key: unique request key (required).
- **Request Body / Validation:** installationId:string required (random app installation ID, not hardware identifier); platform:ios|android required; provider:expo required in this conditional contract; pushToken:string required. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 201 for creation; 200 for an existing installation upsert.
- **Success Response schema:** Device in data for both statuses; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource. 409 IDEMPOTENCY_CONFLICT.
- **Frontend Consumer:** settings.tsx push toggles; no push token acquisition code.
- **Notes:** Conditional on choosing Expo push. Validate actual token/project binding; never log or echo token. Upsert installation/owner binding, replace rotated tokens, unregister invalid tokens, respect preferences and OS permission. expo-notifications is not installed.

Request example:

```json
{
  "installationId": "installation_01",
  "platform": "android",
  "provider": "expo",
  "pushToken": "ExponentPushToken[example-not-valid]"
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "id": "device_01",
    "platform": "android",
    "provider": "expo",
    "createdAt": "2026-09-22T10:00:00Z"
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E61. DELETE /api/v1/devices/:id

**Status:** PROPOSED; PLANNED · REQUIRED if push is implemented.

- **Purpose:** Remove owner's installation registration.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 204.
- **Success Response schema:** No content.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** Future logout/push-disable lifecycle.
- **Notes:** Token removal must also occur server-side on revoked sessions/account deletion; logout cannot depend only on best-effort client cleanup.

Success: HTTP 204, zero response-body bytes.

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E62. POST /api/v1/routes

**Status:** PROPOSED; PLANNED / OPTIONAL · not currently wired.

- **Purpose:** Persist a route draft or explicit start.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>; Content-Type: application/json; Idempotency-Key: unique request key (required).
- **Request Body / Validation:** mode:TransitMode required; placeIds:ordered unique string[] required; selectedPlaceId:string or null optional; departureAt:timestamp or null optional; status:draft|active optional defaults draft. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 201.
- **Success Response schema:** Route in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource. 409 IDEMPOTENCY_CONFLICT.
- **Frontend Consumer:** route.tsx waypoints/mode/start; draft saved-route intent.
- **Notes:** Current route state may remain device-local. Enable cloud persistence only after product consent. No actual routing geometry, ETA, or live GPS is promised by this record.

Request example:

```json
{
  "mode": "walking",
  "placeIds": [
    "place_01"
  ],
  "selectedPlaceId": "place_01",
  "status": "draft"
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "id": "route_01",
    "mode": "walking",
    "placeIds": [
      "place_01"
    ],
    "selectedPlaceId": "place_01",
    "status": "draft",
    "departureAt": null,
    "startedAt": null,
    "endedAt": null
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E63. GET /api/v1/routes

**Status:** PROPOSED; PLANNED / OPTIONAL · not currently wired.

- **Purpose:** Read owned saved-route/history records.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** page, limit; status:draft|active|ended optional; sort=startedAt:desc only, null draft starts last.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** Route[] in data; page/limit/total/totalPages in meta.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** Draft history; profile route counter; Travel static suggestions are not user history.
- **Notes:** No existing route-history UI. Public suggested trips need a separately approved curated content source, not exposure of other users' routes.

Success example:

```json
{
  "success": true,
  "data": [
    {
      "id": "route_01",
      "mode": "walking",
      "placeIds": [
        "place_01"
      ],
      "selectedPlaceId": "place_01",
      "status": "draft",
      "departureAt": null,
      "startedAt": null,
      "endedAt": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E64. GET /api/v1/routes/:id

**Status:** PROPOSED; PLANNED / OPTIONAL · not currently wired.

- **Purpose:** Read one owned route summary.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** Route in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** Draft route summary; future restored route screen.
- **Notes:** Resolve place IDs through place data; server visibility and access apply to every referenced stop.

Success example:

```json
{
  "success": true,
  "data": {
    "id": "route_01",
    "mode": "walking",
    "placeIds": [
      "place_01"
    ],
    "selectedPlaceId": "place_01",
    "status": "draft",
    "departureAt": null,
    "startedAt": null,
    "endedAt": null
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E65. PATCH /api/v1/routes/:id

**Status:** PROPOSED; PLANNED / OPTIONAL · not currently wired.

- **Purpose:** Update owned route stops, mode, departure, or lifecycle.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>; Content-Type: application/json.
- **Request Body / Validation:** Optional mode:TransitMode; placeIds:ordered unique string[]; selectedPlaceId:string or null; departureAt:timestamp or null; status:active|ended. At least one. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** Route in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource. 409 CONFLICT for invalid transition.
- **Frontend Consumer:** route.tsx add/remove/start/end/departure controls.
- **Notes:** Server sets start/end timestamps; draft→active→ended only. Ending a route revokes associated active shares if that association is approved. Do not return simulated 12-minute travel progress as actual telemetry.

Request example:

```json
{
  "status": "ended"
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "id": "route_01",
    "mode": "walking",
    "placeIds": [
      "place_01"
    ],
    "selectedPlaceId": "place_01",
    "status": "ended",
    "departureAt": null,
    "startedAt": "2026-09-22T09:45:00Z",
    "endedAt": "2026-09-22T10:00:00Z"
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E66. POST /api/v1/check-ins

**Status:** PROPOSED; PROPOSED · REQUIRED if check-in becomes durable.

- **Purpose:** Record explicit user-selected place check-in.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>; Content-Type: application/json; Idempotency-Key: unique request key (required).
- **Request Body / Validation:** placeId:string required; observedAt:timestamp required; routeId:string optional. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 201.
- **Success Response schema:** CheckIn in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource. 409 IDEMPOTENCY_CONFLICT.
- **Frontend Consumer:** route.tsx handleCheckIn.
- **Notes:** A manual check-in is not verified presence. No GPS upload or recipient notification is implicit. Consolidates draft route-specific checkin alias.

Request example:

```json
{
  "placeId": "place_01",
  "observedAt": "2026-09-22T10:00:00Z"
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "id": "checkin_01",
    "placeId": "place_01",
    "observedAt": "2026-09-22T10:00:00Z",
    "createdAt": "2026-09-22T10:00:00Z",
    "status": "recorded"
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E67. GET /api/v1/check-ins

**Status:** PROPOSED; PLANNED / OPTIONAL · not currently wired.

- **Purpose:** Read private check-in history.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** page, limit; routeId:string optional (owned); sort=createdAt:desc only.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** CheckIn[] in data; page/limit/total/totalPages in meta.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** Draft history intent; no current screen.
- **Notes:** No public activity feed is implied; retention must be approved.

Success example:

```json
{
  "success": true,
  "data": [
    {
      "id": "checkin_01",
      "placeId": "place_01",
      "observedAt": "2026-09-22T10:00:00Z",
      "createdAt": "2026-09-22T10:00:00Z",
      "status": "recorded"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E68. GET /api/v1/check-ins/:id

**Status:** PROPOSED; PLANNED / OPTIONAL · not currently wired.

- **Purpose:** Read a private check-in.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** CheckIn in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** Draft status lookup; route timer currently local.
- **Notes:** Returns server receipt, not delivery to contacts or physical safety confirmation.

Success example:

```json
{
  "success": true,
  "data": {
    "id": "checkin_01",
    "placeId": "place_01",
    "observedAt": "2026-09-22T10:00:00Z",
    "createdAt": "2026-09-22T10:00:00Z",
    "status": "recorded"
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E69. POST /api/v1/location-shares

**Status:** PROPOSED; PLANNED / OPTIONAL · security-gated snapshot service.

- **Purpose:** Create an explicitly consented expiring location snapshot.
- **Authentication:** Required.
- **Path Parameters:** None.
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>; Content-Type: application/json; Idempotency-Key: unique request key (required).
- **Request Body / Validation:** coords:Coords required; accuracyMeters:nonnegative number required; observedAt:timestamp required; expiresAt:future timestamp required; recipientContactIds:nonempty unique owned-contact string[] required; privacyLevel:string required; only exact accepted in this conditional version. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 201.
- **Success Response schema:** LocationShare in data; meta is an empty object unless stated.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource. 409 IDEMPOTENCY_CONFLICT. 403 VERIFICATION_REQUIRED; 422 missing consent/invalid coordinates/expiry.
- **Frontend Consumer:** profile-setup/location toggles and trusted-contact live GPS imply intent only; route currently shares static place links.
- **Notes:** Do not implement until recipient identity/consent and precision policy are approved. Snapshot only: no polling/upload stream required. Example 30-minute expiry is illustrative, not policy. Exact coordinates are visible only to the owner and explicitly authorized recipients of a valid exact share. Non-exact modes remain rejected until server-side precision transformations are defined and approved.

Request example:

```json
{
  "coords": {
    "latitude": -26.1952,
    "longitude": 28.0341
  },
  "accuracyMeters": 30,
  "observedAt": "2026-09-22T10:00:00Z",
  "expiresAt": "2026-09-22T10:30:00Z",
  "recipientContactIds": [
    "contact_01"
  ],
  "privacyLevel": "exact"
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "id": "share_01",
    "coords": {
      "latitude": -26.1952,
      "longitude": 28.0341
    },
    "accuracyMeters": 30,
    "observedAt": "2026-09-22T10:00:00Z",
    "expiresAt": "2026-09-22T10:30:00Z",
    "status": "active",
    "recipientContactIds": [
      "contact_01"
    ],
    "privacyLevel": "exact"
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E70. GET /api/v1/location-shares/:id

**Status:** PROPOSED; PLANNED / OPTIONAL · security-gated snapshot service.

- **Purpose:** Read own share or authorized unexpired snapshot.
- **Authentication:** Required; owner or approved recipient ACL.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 200.
- **Success Response schema:** Owner receives LocationShare. Recipient receives LocationShare with recipientContactIds omitted; every remaining field retains its table type, requiredness, and nullability. Only privacyLevel exact is supported in this gated version. meta is an empty object.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource. 404 NOT_FOUND for unauthorized viewers; 410 LOCATION_SHARE_EXPIRED for formerly authorized expired/revoked share.
- **Frontend Consumer:** No current recipient viewer; required only if hosted location sharing is approved.
- **Notes:** Owner receives full LocationShare. Authorized recipient receives only id, coords, accuracyMeters, observedAt, expiresAt, status, and privacyLevel (exact); no recipientContactIds. Omitted ACL does not make it an owner-readable full model. Only exact mode is enabled after explicit consent; non-exact modes are gated pending wire-schema approval. Mere knowledge of ID is insufficient. Authenticated accepted-recipient identity mapping is ENGINEERING DECISION REQUIRED before exposing this endpoint.

The success example below is the **owner response**. The authorized recipient receives:

```json
{
  "success": true,
  "data": {
    "id": "share_01",
    "coords": {"latitude": -26.1952, "longitude": 28.0341},
    "accuracyMeters": 30,
    "observedAt": "2026-09-22T10:00:00Z",
    "expiresAt": "2026-09-22T10:30:00Z",
    "status": "active",
    "privacyLevel": "exact"
  },
  "meta": {}
}
```

Success example:

```json
{
  "success": true,
  "data": {
    "id": "share_01",
    "coords": {
      "latitude": -26.1952,
      "longitude": 28.0341
    },
    "accuracyMeters": 30,
    "observedAt": "2026-09-22T10:00:00Z",
    "expiresAt": "2026-09-22T10:30:00Z",
    "status": "active",
    "recipientContactIds": [
      "contact_01"
    ],
    "privacyLevel": "exact"
  },
  "meta": {}
}
```

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

### E71. DELETE /api/v1/location-shares/:id

**Status:** PROPOSED; PLANNED / OPTIONAL · security-gated snapshot service.

- **Purpose:** Immediately revoke an owned share.
- **Authentication:** Required.
- **Path Parameters:** id: required opaque string identifying the resource described below
- **Query Parameters:** None.
- **Request Headers:** Accept: application/json; Authorization: Bearer <access token>.
- **Request Body / Validation:** None. Apply section 3 for this form; numeric maxima not evidenced there remain engineering decisions.
- **HTTP Status:** 204.
- **Success Response schema:** No content.
- **Error Responses:** 400 BAD_REQUEST; 422 VALIDATION_ERROR; 429 RATE_LIMITED; 500 INTERNAL_ERROR; 503 SERVICE_UNAVAILABLE. 401 UNAUTHENTICATED/SESSION_EXPIRED; 403 FORBIDDEN; 404 NOT_FOUND for private/missing resource.
- **Frontend Consumer:** No current explicit revoke UI; production requirement if hosted shares exist.
- **Notes:** Invalidate all recipient access/cache paths immediately and stop collection. Remote revocation cannot retract already copied coordinates or SMS links.

Success: HTTP 204, zero response-body bytes.

Error example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "fields": {}
  }
}
```

## 7. FRONTEND INTEGRATION MAP

“Required API” names refer to section 6 proposed contracts, not installed clients. Entries explicitly marked local do not need a backend. Every route file, data-bearing component, service, and store is accounted for below.

| Frontend screen/feature | Current data source / operation | Required API or boundary | Integration status |
| --- | --- | --- | --- |
| `app/index.tsx` | Persisted isAuthenticated and hydration redirect | auth/session, auth/refresh | MOCKED auth; production bootstrap required |
| `app/onboarding.tsx` | Static slides; local completion/navigation | No API for presentation; owner setup state in users/me if needed | EXISTING local |
| `app/login.tsx` | Prefilled mock email; mockOtpService; local login; simulated providers/biometric | auth/login, verify-otp, otp/resend; planned forgot/reset; provider decision | MOCKED |
| `app/register.tsx` | Name/surname/email/phone form; local OTP; navigates setup | auth/register, verify-otp, otp/resend | MOCKED; password provisioning unresolved |
| `app/profile-setup.tsx` | Local location/interests/photo/contacts; share flag | users/me PATCH; trusted-contacts create; media/upload; settings PATCH | MOCKED; no real GPS or durable completion |
| `app/(tabs)/home.tsx` | MOCK_USER/PLACES/EVENTS, local saved IDs, notifications, comments, hard-coded safety story | users/me, places, events, saved-places, campaigns/featured, community/feed/comments, notifications | MOCKED; identify canonical safety-story post |
| `app/(tabs)/explore.tsx` | In-memory place/event substring search; no-op bookmark | places/events queries; saved-places when save action is wired | MOCKED reads; no global people search despite placeholder |
| `app/(tabs)/community.tsx` | MOCK_POSTS; local compose/likes/count-only comments/share increment | community feed/posts/comments/reactions | MOCKED; device sharing EXISTING |
| `app/(tabs)/route.tsx` | MOCK_PLACES; fixed origin; local filters/waypoints/timers/check-in/departure; contact SMS picker | places, trusted-contacts, saved-places; conditional routes/check-ins/location-shares | Local planning and device actions EXISTING; telemetry MOCKED |
| `app/(tabs)/profile.tsx` | MOCK_USER, savedPlaces, static stats 4/12/89; placeholder Groups/Activity | users/me, saved-places; stats/group/activity decisions | MOCKED |
| `app/places/[id].tsx` | First-place fallback; review cache; waypoint add; Google Maps link | places/:id and reviews; conditional route persistence | MOCKED data; external directions EXISTING |
| `app/events/[id].tsx` | First-event fallback; local attendance form | events/:id, events/:id/register | MOCKED; no current review/save/payment form |
| `app/directory.tsx` | DIRECTORY_RESOURCES/CATEGORIES; in-memory category/text filter | directory/resources; optional categories | MOCKED read/search |
| `app/travel.tsx` | Three static trip suggestions, labels and durations; route CTA | No required API for static tips; planned curated suggestions need separate contract | MOCKED suggestions; no booking/navigation service |
| `app/safety.tsx` | MOCK_SAFETY_RESOURCES; tel:112 / external links | safety/resources; dialer remains local | MOCKED catalogue; no dispatch service |
| `app/emergency-contacts.tsx` | Device picker/manual fields; local store; preference switches; removal | trusted-contacts CRUD | Device picker EXISTING; server persistence/verification missing |
| `app/settings.tsx` | Local MOCK_USER edits, image URI, notification/privacy switches, selfie timer, deactivate/logout | users/me, settings, media, selfie-verifications, deactivate, logout | MOCKED persistence/verification; picker EXISTING |
| `app/change-password.tsx` | Frontend rules and mock OTP; only displays success | password challenge/change; recovery flow requires separate integration | MOCKED |
| `app/manage-sessions.tsx` | Three static device rows; remove by device label; sign-out-all no-op | auth/sessions read/delete and delete-all | MOCKED |
| `app/privacy-settings.tsx` | Four independent booleans | users/me/settings read/PATCH | MOCKED; enforce server-side |
| `app/_layout.tsx` | Query provider, fonts, splash, manual Expo update check | No custom application endpoint; Expo Updates remains separate | EXISTING platform infrastructure |
| `app/(tabs)/_layout.tsx` | Tab navigation and insets | No API | EXISTING presentation |
| `CircleOfLoveCard.tsx` | Hard-coded campaign/metrics, timed RSVP success, share sheet, simulated copy | campaigns/featured and RSVP; optional catalogue/detail | MOCKED data/RSVP; no payment/marriage certification |
| `ReviewSection.tsx` | Rating/headline/comment form; parent callback | place review creation/read; event counterpart planned only | MOCKED local persistence |
| `NearbyCard.tsx`, `EventCard.tsx` | Props from mock catalogues | Place/Event models through parent APIs | No independent request |
| `PlaceMapSheet.tsx`, `RouteMap.tsx`, `RouteMap.web.tsx`, `routeGeometry.ts` | Place props, static/map-derived display, timer interpolation, heuristic metrics | Place data; external map/routing provider decision | No existing telemetry/geocoding API |
| `AppHeader.tsx` | MOCK_USER, hard-coded badge 3, local share flag as Online/Offline | users/me, notifications metadata, settings | MOCKED presence; sharing flag is not online status |
| `NotificationBar.tsx` | Props; Home embeds a hard-coded action/banner | Resolve from approved content or keep editorial UI; no invented dispatch endpoint | Presentational |
| `src/services/contacts.ts` | Expo contact permission/picker and phone normalization | Upload selected contact only to trusted-contacts | EXISTING device service |
| `src/services/sharing.ts` | navigator.share or React Native Share | No mandatory share endpoint | EXISTING device service; delivery unproven |
| `src/services/mockOtpService.ts` | Math.random code in memory | Auth challenge/verification lifecycle | MOCKED; remove production dependency later |
| `src/store/useAppStore.ts` | AsyncStorage auth, onboarding, location preference, waypoints/mode, reviews | Auth/profile/settings/reviews; optional route records | MOCKED domain persistence |
| `src/store/useEmergencyContactsStore.ts` | AsyncStorage plus demo contacts | trusted-contacts | MOCKED cross-device source |
| `src/context/ThemeProvider.tsx` | Local state; web localStorage writes | No mandatory theme API | EXISTING device-local preference |
| `src/data/mockData.ts`, `mockUser.ts`, `directoryData.ts` | Bundled domain fixtures | Read models/catalogue endpoints | MOCKED; not production seed truth |
| `src/types/`, `navigation/`, `layout/`, `constants/`, remaining UI/motion/splash components and styles | Types, helpers, assets, presentation | No independent backend operations | EXISTING frontend infrastructure |

## 8. MOCK → PRODUCTION MIGRATION

The following **26 integration groups** cover domain mocks and local data. This count is not a count of mocked functions. File paths are relative to the repository; this document does not modify them.

| ID | Current implementation and files | Production replacement / required endpoint |
| --- | --- | --- |
| G01 | Local authentication boolean/OTP; login/register/mockOtpService/useAppStore | Challenge lifecycle, session bootstrap/refresh/logout; remove arbitrary OTP fallback and demo code output |
| G02 | Simulated Gmail/Apple/biometric in login | Provider-verified exchange and secure device unlock; protocol decision, not a generic fake success API |
| G03 | Register lacks initial password; Forgot password opens current-password form | Define credential provisioning; auth/forgot-password and reset-password planned contracts; future frontend work |
| G04 | Change-password validates client-side but only displays success | auth/change-password/challenge and change-password; invalidate sessions |
| G05 | Hard-coded identity in mockUser, header, Home, Profile, Settings | users/me; derive consistent owner identity; migrate display initials/images |
| G06 | Profile setup transient location/interests/contacts/photo and fake live strings | users/me, settings, trusted-contacts, media; transactional/retry-aware step completion |
| G07 | Settings editable fields have no server save | users/me PATCH; define save/debounce/conflict UX and verified email/phone changes |
| G08 | Local picked image/blob; profile-setup fixed photo | media/upload then profileImageId attachment; handle failed upload before success |
| G09 | Selfie capture becomes verified after timer | Private media + selfie-verifications with real approved verification; no automatic trust |
| G10 | Three session fixtures and no-op sign-out-all | auth/sessions; server session IDs, revocation and current-device transitions |
| G11 | Deactivation checks nonempty password and logs out | users/me/deactivate; approve 365-day claim/retention; deletion separate |
| G12 | Notification, security, privacy flags reset/local across screens | users/me/settings, verified two-factor enrollment protocol; enforce consent on server |
| G13 | MOCK_PLACES and first-place fallback | places queries/details; genuine unavailable/not-found state and trusted curation |
| G14 | Home/Route bookmarks and MOCK_USER.savedPlaces diverge | users/me/saved-places; distinguish bookmarks from route waypoints; Explore save no-op needs wiring |
| G15 | MOCK_EVENTS and first-event fallback; local registered flag | events reads/register; preserve actual event ID, receipt and attendee aggregate |
| G16 | DIRECTORY_RESOURCES/CATEGORIES | directory queries/taxonomy; verify claims and source data before ingestion |
| G17 | MOCK_POSTS plus ephemeral compose/likes | feed/post/reaction contracts; authenticated author and authoritative counts |
| G18 | Community comment text discarded; Home comment array/story separate | canonical post ID + persistent comments; no fabricated connection between stories |
| G19 | Local share success/counters and generic hard-coded share URLs | Device share remains local; approve canonical links/delivery semantics before optional analytics |
| G20 | useAppStore reviewCache; local author “You”; mock embedded reviews | Place review read/create; reconcile server totals and paginated lists; event reviews planned |
| G21 | CircleOfLove hard-coded metrics/form timed success/fake clipboard message | Featured campaign + RSVP; real clipboard remains frontend task; role/accessibility privacy enforced |
| G22 | Contact demo fixtures/local flags; empty persisted list repopulates defaults | trusted-contacts; preserve empty server list; bind cache per user; never migrate demo contacts automatically |
| G23 | Fixed route origin, heuristic metrics, local waypoints/timers/departure/check-in | Real place data; optional route/check-in records; approve routing provider and live-location scope independently |
| G24 | “Live” location flags without sensors; SMS/place link sharing | Permission/consent-driven acquisition only if approved; optional expiring share service, never continuous collection by default |
| G25 | MOCK_SAFETY_RESOURCES and static Travel trips/tips | safety/resources; keep dialer local; planned curated-trip source decision, no implicit SOS escalation |
| G26 | Home notification fixtures/header badge, static profile stats/Groups/Activity | notifications and read lifecycle; conditional devices; stats/group/activity data contracts require product definitions |

Local-only state intentionally retained: selected tabs, search drafts, composing text, expanded panels, theme, animation and reduced-motion state, modal visibility, temporary image previews, and permission prompts. Do not create persistence endpoints for every useState.

Storage migration rules:

- `pink-plug-store`: holds onboardingComplete, isAuthenticated, shareLocation, waypoints, transitMode, reviewCache. Never migrate the boolean as authentication or mock review IDs as trusted records. Logout must revoke server session and clear user-scoped caches.
- `pink-plug-emergency-contacts`: currently not user-scoped and not cleared by the general store logout. Isolate account caches, require explicit user confirmation before importing real contacts, do not import demo fixtures, and respect an empty server result.
- `pink-route-theme`: web localStorage presentation preference; no secure data belongs here. Source defines a read helper but initializes theme from a default; cross-launch preference behavior is a frontend issue, not a backend requirement.
- Fresh accounts must not inherit MOCK_USER contacts, posts, verification badges, saved places, counters, or default “verified” contact states.
- Replace optimistic/timed success only after a confirmed API result. For offline/retry behavior, distinguish pending, failed, and confirmed operations; use idempotency keys for creation.
- Current list searches are local. Pagination integration must not search only the loaded page or present loaded count as global total. Query keys include owner, filters, page, and permissions; clear private cache on account switch.
- AsyncStorage is not an approved token vault. Mobile secure token storage and web session/cookie transport require separate implementation decisions.

## 9. Security requirements

These are proposed production requirements, not evidence of completed controls:

- HTTPS, strict certificate validation, and approved CORS origin allowlists; no credentialed wildcard origins. CORS is not an authorization boundary.
- Validate tokens, audience/issuer where applicable, expiry, revocation, owner scope, and object-level permissions on every request. Opaque versus JWT tokens remains undecided.
- Short-lived access and rotating refresh credentials with replay/reuse handling. Define expiry and retry budgets. Use an appropriate OS-backed secure store on mobile; no refresh tokens in AsyncStorage, localStorage, logs, or URLs. Web HttpOnly/Secure/SameSite and CSRF design must be approved.
- Passwords must use an approved adaptive password hashing scheme with unique salts; never plaintext or reversible storage. Algorithm/work factors, breach screening, and provisioning are engineering decisions.
- OTPs must use a cryptographically secure generator, purpose-bound expiry, single use, secure at-rest representation, resend throttles, and attempt limits. No codes in production JSON responses, logs, or debug UI.
- Derive authors/owners/server verification state. Reject mass assignment. Validate syntax, enums, coordinate bounds, text/size limits, and resource references. Escape untrusted strings for web/native WebView contexts.
- Rate-limit login, OTP send/verify, refresh, posting/comments/reviews, uploads, registration/RSVP, contact changes, and share access. Numeric thresholds and abuse escalation remain open.
- Apply idempotency and concurrency controls to avoid duplicate messages, reviews, registrations, or contact creation. Contact-count enforcement must be transactional.
- Separate device push tokens from authentication tokens. Bind installations to accounts; revoke on logout/switch; redact tokens and signed media links.
- Enforce privacy in query selection and serialization. Private User fields, contacts, route history, verification media, and raw location must never enter public feed objects.
- Media uploads require actual content inspection, size/pixel policy, safe decoding, EXIF stripping, authorization, owner attachment checks, and private verification storage. Do not proxy arbitrary remote image URLs without SSRF protection.
- Store credentials/provider keys only in server secret management. Client API base URL is public configuration. Separate environments and restrict production administrative access.
- Audit security-relevant actions with actor, action, target ID, timestamp, outcome, and correlation ID; minimize personal data. Never log passwords, OTPs, access/refresh tokens, raw selfies, exact route traces, or contact lists.
- Define alerting, incident response, backup restoration, dependency review, and moderation operations. No production security guarantee follows from this documentation.

## 10. Draft reconciliation and conditional scope

The draft is preserved. Its CONFIRMED labels meant observed intent, not deployed APIs. The following retained decisions avoid silently dropping legitimate requirements or promising unsupported features.

| Draft requirement | Final disposition |
| --- | --- |
| Auth/register/login/verify/logout/refresh | Specified; added secure session lifecycle and resend. No existing backend claimed. |
| Password-reset request/confirm | Consolidated into forgot-password/reset-password; PLANNED production recovery gap with frontend work required. |
| Avatar endpoint versus media/upload | One canonical multipart media upload plus users/me profileImageId; no duplicate avatar upload API needed. |
| Private/public user profile | Private users/me specified. Public profile lookup remains PLANNED pending minimal public schema/privacy rules; no other-user profile route exists. |
| users/me/privacy and preferences | Consolidated into users/me/settings; duplicate profileVisible controls map to one value. |
| Home summary aggregate | OPTIONAL optimization: compose user/catalogue/notifications/campaign/feed APIs first; no separate aggregate required. |
| Nearby places | Consolidated into places latitude/longitude/radiusKm query; no duplicate route. |
| Community post read/delete | Read retained PLANNED. Own-post deletion retained PLANNED requirement; request/retention/cascade/moderation behavior requires approved UI/policy before adding an endpoint. |
| Comments and reactions | Specified; comment persistence is required even though current Community discards text. |
| Post/campaign/route/check-in share endpoints | OPTIONAL analytics or hosted sharing only. OS share/SMS needs no API; delivery semantics, canonical destinations, recipient consent, and analytics policy must be designed before endpoint creation. |
| Campaign list/detail/RSVP | Featured + RSVP required; list/detail retained PLANNED. No campaign management UI. |
| Event reviews | Read/create retained PLANNED based on type/store/draft, not falsely described as current form. |
| Routes/history/update | Retained PLANNED conditional cloud persistence. Static Travel suggestions need a curated content decision, not user-history data. |
| Route checkin and global check-ins | Consolidated into check-ins with optional owned routeId; history/detail retained PLANNED. |
| trusted-contacts and safety/contacts | Consolidated owner resource; consent/invitation acceptance remains unresolved. |
| Safety SOS escalation | PLANNED / ENGINEERING DECISION REQUIRED. Current action is tel:112. Do not deploy a pretend dispatch endpoint without responders, consent, delivery/acknowledgement, and escalation policy. |
| Notification read/read-all | Retained PLANNED; current Home does not wire those mutations. |
| Notification type/deepLink metadata | Draft inferred classification and navigation fields remain PLANNED pending approved notification categories and safe route targets; the current frontend does not consume them. They are not fields of the current proposed Notification model. |
| Push/email services | Preferences observed. Device registration conditional on Expo selection; provider/delivery/consent/receipt design remains open. |
| Account deactivation | Specified; 365-day reactivation text requires product/legal approval. Deletion is separate PLANNED privacy lifecycle. |
| Unified search | OPTIONAL and deferred: separate place/event/directory endpoints satisfy current forms. People search placeholder is not implemented. |
| Media metadata | Retained PLANNED; private upload deletion added as lifecycle hygiene, not a current delete button. |
| Selfie verification | Required UI intent; no verification algorithm/provider is implied. Private submission/status contract proposed, biometric review required. |
| Moderation and abuse process | REQUIRED FOR PRODUCTION community operations. No current reporting/blocking controls; target taxonomy, reasons, appeal/ownership/deletion policy are ENGINEERING DECISION REQUIRED. No invented Report model. |
| Location privacy / route retention | Retained as release gates; optional snapshot contracts do not imply continuous tracking. |

No post editing, event/venue admin CRUD, saved-event controls, review editing/deletion, payment/ticketing, messaging conversations, follower mutations, or group administration API is currently mandated. If approved later, define explicit models/authorization/validation before adding endpoints. Draft inferred requirements are retained above as PLANNED rather than deleted.

## 11. Privacy & POPIA considerations

This section is engineering planning, not legal advice or a compliance certification. The South African [Protection of Personal Information Act 4 of 2013](https://www.justice.gov.za/legislation/acts/2013-004.pdf) is the reference for product/legal review.

Minimize collection and state purposes before processing. Restrict access to profiles, location, emergency contacts, and verification images. Define justified retention, correction/access requests, deletion and backup handling, and auditable consent/revocation. Account deactivation does not automatically satisfy deletion needs.

Community affiliations, accessibility messages, identity verification, and location may reveal particularly sensitive information; legal/product must determine the applicable processing basis and safeguards. Contact information concerns third parties, not only the account owner. Define notices/consent, provider obligations, international transfers, breach procedures, and controls for children if in scope. Do not adopt the UI's 365-day promise as an approved retention policy.

## 12. API implementation priority

No arbitrary dates are assigned.

1. **Phase 1 — Core identity and privacy foundation:** approve provisioning/recovery/provider decisions; authentication, sessions, private profile, settings enforcement, deactivation/deletion policy, token storage, rate limits, and environment configuration. Establish private media handling before selfie/profile integrations.
2. **Phase 2 — Core application data:** places/directory, events/registration, campaigns/RSVP, saved places, place reviews, community text/posts/comments/likes. Define moderation ownership before exposing user-generated content. Implement honest empty/error states and pagination.
3. **Phase 3 — Safety:** curated safety resources, trusted contacts and consent/verification, manual check-ins if approved. Cloud routes and hosted location sharing remain gated on identity/retention/recipient design. Do not market live monitoring based on local timers.
4. **Phase 4 — Supporting services:** notification delivery/device registration if approved, read state, provider integrations, optional event reviews/history/public profiles, moderation/reporting UI and contracts. Revisit performance optimizations after actual client usage is measured.

Media/settings move into Phase 1 because current profile/security flows depend on them; they are not deferred merely to match a generic phase template.

## 13. Completeness audit and acceptance

Coverage procedure: inventoried all `app/` route files and `src/` source files; reviewed forms, handlers, data imports, network/storage signals, platform variants, and types; re-scanned for TextInput, state changes, local persistence, mock sources, fetch/query hooks, device location, and push APIs. Compared endpoint/model coverage against the original draft and recorded each retained inferred service in section 10.

Findings that prevent claiming a fully settled implementation contract:

- No current backend calls, API client, configured API URL, device geolocation acquisition, push registration, or server pagination were found.
- Account creation/password provisioning, changed identity verification, two-factor enrollment, and recovery need coordinated frontend/backend decisions.
- Home's hard-coded community story has no canonical persisted post ID.
- Privacy and “live” labels are not proofs of enforcement, GPS collection, delivery, or presence.
- Pure display counters, Travel suggestions, Groups/Activity, public profiles, contact invites, social sign-in, and reporting/moderation cannot be confidently assigned final payloads from the current UI.
- Source `Event` permits a bundled image object; REST uses HTTPS strings. Directory is distinct from Place. Draft saved-place IDs must map to the actual User.savedPlaces object array or a documented adapter.
- Public safety resources need verified content ownership. Place safety scores and verification badges need provenance and review policy before production use.
- Every JSON code example is parseable and uses concrete fields. Example passwords/tokens/phones/domains are illustrative and not credentials or endpoints to call.
- The final endpoint index counts only the fully specified contracts in section 6; unresolved operations in section 10 are not counted as implemented or fully specified APIs.

Future integration acceptance must exercise 401/403/404/409/422/429, offline/retry, pagination/filtering, ownership isolation, account switching, expired/revoked shares, permission denial, failed image uploads, and duplicate submissions. Do not replace local success simulations without handling actual errors.

## 14. OPEN ENGINEERING DECISIONS

1. Backend language/framework, database, hosting/regions, deployment and operational ownership.
2. Identity provider and access-token format; initial password provisioning missing from registration.
3. Email/SMS verification providers, delivery channel rules, expiry, attempt/resend limits, and account-enumeration resistance.
4. Forgot-password UX; password policy maxima; current-session behavior after reset/change; account reactivation rules.
5. Social login provider exchange/redirects; biometric device unlock; two-factor enrollment/recovery and security-factor change verification.
6. Mobile secure token store; browser cookie/CSRF transport; refresh reuse detection and safe concurrency/retry window.
7. Profile handle normalization/uniqueness, name/surname mapping, changed email/phone verification, and setup completion requirements.
8. Server authority and public meaning of user verification and selfie verification; liveness/reviewer workflow and biometric processing basis.
9. Media provider, allowed types, byte/pixel/volume limits, transformation, private URLs, orphan cleanup, replacement and deletion lifecycle.
10. Catalogue source/curation, place safety-score methodology, verification badges, directory credential verification, and content refresh.
11. Event schedules/timezones, default sorting, capacity, duplicate/cancellation policy, and whether ticket/payment flows are ever in scope.
12. Campaign ownership, duplicate RSVP policy, treatment of accessibility notes, retention, and canonical share destinations.
13. Text limits, review uniqueness, edit/delete rights, moderation/reporting workflow, reason taxonomy, appeals, and abuse response staffing.
14. Saved-place migration; profile stats/group/activity/following semantics; public-profile fields and visibility policy.
15. Contact ownership/recipient consent, invitation verification, duplicate rules, account-scoped caching, and the setup/contact-limit inconsistency.
16. Actual map/routing/location providers, attribution/licensing, measured location versus venue pins, ETA guarantees, and background-location exclusion.
17. Hosted route/check-in necessity, recipient viewer identity, location precision schemas, consent, expiry maxima, retention and revocation.
18. Whether SOS ever escalates beyond the dialer; authorized recipients/responders, acknowledgement, delivery guarantees, and operating responsibilities.
19. Expo versus another push service, device registration/project binding, email provider, mute duration, receipts/retries, and lock-screen data policy.
20. Privacy enforcement semantics, account deletion, the 365-day deactivation claim, retention schedules, children, third-party contacts, and POPIA/legal review.
21. Pagination default/max approval, catalogue ordering, search locale/relevance, query bounds, and any future global-search requirement.
22. Idempotency persistence window, PATCH concurrency, transaction boundaries, eventual consistency and client reconciliation.
23. Rate limits/quotas, observability/redaction, audit retention, incident response, backups and restore testing.
24. Real API URLs, environment segregation, CORS origins, secret management, CI/contract tests and staging/mobile test ownership.

## API HANDOVER CHECKLIST

These items are not marked complete by writing this specification. For conditional features, record an approved deferral rather than implying implementation.

- [ ] Base URLs configured
- [ ] Authentication implemented
- [ ] Refresh/session lifecycle implemented
- [ ] Initial password provisioning and recovery gaps resolved
- [ ] Profile API integrated
- [ ] Events integrated
- [ ] Places integrated
- [ ] Community integrated
- [ ] Reviews integrated
- [ ] Campaign RSVP integrated
- [ ] Emergency contacts integrated
- [ ] Location sharing security reviewed
- [ ] Media uploads configured
- [ ] Notifications configured or explicitly deferred with UI claims reconciled
- [ ] Settings persistence implemented
- [ ] Reporting/moderation implemented or approved scoped alternative recorded
- [ ] Rate limiting configured
- [ ] Production secrets configured
- [ ] POPIA/privacy requirements reviewed
- [ ] Staging integration tested
- [ ] Android integration tested
- [ ] iOS integration tested
- [ ] Production API smoke tested
