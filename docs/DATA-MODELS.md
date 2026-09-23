# Frontend data models

There are 25 named wire models. This is a frontend data contract, not a database schema. Each model link below opens its canonical field table with **field name, expected type, required/optional, nullable behavior and meaning**. Keeping those tables in one specification prevents competing schemas. Relationships and frontend consumers are indexed here.

Required means present. Optional means omitted unless available; null is permitted only where stated. PATCH omission means unchanged. REST images are HTTPS strings even where frontend fixtures permit ImageSourcePropType. Server assigns identity/ownership/verification/counts; clients cannot mass-assign read models.

| Model / field definitions | Relationships and frontend usage |
| --- | --- |
| [Coords fields](API-SPECIFICATION.md#m01-coords) | Place and location-share coordinates; maps/Route. |
| [Review fields](API-SPECIFICATION.md#m02-review) | Author-owned review of a place/event; detail and ReviewSection. |
| [Place fields](API-SPECIFICATION.md#m03-place) | Coordinates, reviews, saved places and route waypoints; Home/Explore/Route/detail. |
| [Event fields](API-SPECIFICATION.md#m04-event) | Reviews and registrations; cards/event detail. |
| [User fields](API-SPECIFICATION.md#m05-user) | Owner profile, saved Place objects and verification; header/profile/settings/setup. |
| [Session fields](API-SPECIFICATION.md#m06-session) | User-owned session; bootstrap/session management. |
| [AuthChallenge fields](API-SPECIFICATION.md#m07-authchallenge) | Purpose/expiry-bound OTP credential; login/register/change-password/recovery. |
| [AuthSession fields](API-SPECIFICATION.md#m08-authsession) | User and session with token lifecycle; authentication. |
| [DirectoryResource fields](API-SPECIFICATION.md#m09-directoryresource) | Directory category and content; Directory screen. |
| [Category fields](API-SPECIFICATION.md#m10-category) | Taxonomy labels; directory/place filters. |
| [CommunityPost fields](API-SPECIFICATION.md#m11-communitypost) | Author, comments and reactions; community/Home. |
| [Comment fields](API-SPECIFICATION.md#m12-comment) | Post/author relationship; Home/community comments. |
| [EmergencyContact fields](API-SPECIFICATION.md#m13-emergencycontact) | Owner-private third-party contact; contacts/Route. |
| [SafetyResource fields](API-SPECIFICATION.md#m14-safetyresource) | Public curated safety data; Safety. |
| [Campaign fields](API-SPECIFICATION.md#m15-campaign) | RSVP parent and display metrics; CircleOfLoveCard. |
| [EventRegistration fields](API-SPECIFICATION.md#m16-eventregistration) | Event and authenticated participant; event form. |
| [CampaignRsvp fields](API-SPECIFICATION.md#m17-campaignrsvp) | Campaign participant/role/private accessibility notes; RSVP form. |
| [UserSettings fields](API-SPECIFICATION.md#m18-usersettings) | Owner privacy/notification/security preferences; settings/privacy/setup. |
| [Media fields](API-SPECIFICATION.md#m19-media) | Owned purpose-specific upload; profile/selfie. |
| [SelfieVerification fields](API-SPECIFICATION.md#m20-selfieverification) | Private media review; settings verification. |
| [Notification fields](API-SPECIFICATION.md#m21-notification) | Owner message/read state; Home/header. |
| [Device fields](API-SPECIFICATION.md#m22-device) | Owner push installation; conditional notification delivery. |
| [Route fields](API-SPECIFICATION.md#m23-route) | Owner plan with ordered place IDs; conditional Route persistence. |
| [CheckIn fields](API-SPECIFICATION.md#m24-checkin) | Owner manual record with optional route; conditional check-in history. |
| [LocationShare fields](API-SPECIFICATION.md#m25-locationshare) | Owner snapshot and authorized recipients; conditional expiring location service. |

## Frontend-only types

Waypoint (`id`, `place: Place`, `order`) is a local planning object in useAppStore; it is not an extra persistent API model. Tab/Screen unions, typed navigation hrefs, theme values, map geometry, NativeContactSelection and ShareContent describe navigation/presentation/device input rather than extra backend entities.

Use the canonical model mapping notes for frontend differences. Complete embedded review/saved-place compatibility arrays cannot silently become truncated pages. Recipient LocationShare projections omit recipientContactIds; the owner model remains complete. Private verification Media has a null URL. Public profile visibility never makes owner email/phone public.

See [screen mapping](SCREEN-API-MAPPING.md) and [API validation/form rules](API-SPECIFICATION.md#3-frontend-validation-and-integration-rules). The retained draft's inferred fields and conditional features are reconciled in specification section 10.
