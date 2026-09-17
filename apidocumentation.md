# Pink Plug API Documentation

This document defines the backend contract for the Pink Plug mobile app. It is intended to guide backend implementation for the current app flows, including onboarding, authentication, profile setup, places, events, route recommendations, safety features, and community interactions.

Base URL:

```text
https://api.pinkplug.app/v1
```

Authentication:

- JWT Bearer token in Authorization header
- Example: `Authorization: Bearer <token>`
- Token expires after 7 days for the mobile app session
- Refresh token endpoint available when access token expires

Common response format:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "errors": []
}
```

Error response format:

```json
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "code": "INVALID_FORMAT",
      "message": "Email address is invalid"
    }
  ]
}
```

Status codes:

- `200` OK
- `201` Created
- `202` Accepted
- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `409` Conflict
- `422` Validation Error
- `500` Internal Server Error

---

## 1. Authentication & Account Flow

### 1.1 Register account

POST `/auth/register`

Request body:

```json
{
  "firstName": "Bongani",
  "lastName": "Nombamba",
  "email": "bongani.nombamba@email.com",
  "phone": "+27721234567",
  "password": "SecurePass123!"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123",
      "firstName": "Bongani",
      "lastName": "Nombamba",
      "email": "bongani.nombamba@email.com",
      "phone": "+27721234567",
      "createdAt": "2026-09-11T09:15:00Z"
    },
    "token": "jwt.access.token",
    "refreshToken": "jwt.refresh.token"
  },
  "message": "Account created successfully"
}
```

Notes:

- Sends a verification email after registration
- Mobile app expects verification before allowing full onboarding completion

### 1.2 Send verification email

POST `/auth/send-verification-email`

Request body:

```json
{
  "email": "bongani.nombamba@email.com"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "message": "Verification email sent",
    "expiresInSeconds": 300
  }
}
```

### 1.3 Verify email OTP

POST `/auth/verify-email`

Request body:

```json
{
  "email": "bongani.nombamba@email.com",
  "otp": "123456"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "verified": true
  }
}
```

### 1.4 Login with email and password

POST `/auth/login`

Request body:

```json
{
  "email": "bongani.nombamba@email.com",
  "password": "SecurePass123!"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123",
      "firstName": "Bongani",
      "lastName": "Nombamba",
      "email": "bongani.nombamba@email.com",
      "avatarUrl": "https://cdn.pinkplug.app/users/usr_123/profile.jpg"
    },
    "token": "jwt.access.token",
    "refreshToken": "jwt.refresh.token"
  }
}
```

### 1.5 Login with Google / Apple / biometric simulation

These are optional sign-in methods. In the current app, they are simulated and should behave as sign-in shortcuts.

POST `/auth/social-login`

Request body:

```json
{
  "provider": "google",
  "token": "oauth.idToken",
  "deviceType": "ios"
}
```

Supported providers:

- `google`
- `apple`
- `biometric`

Response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123",
      "provider": "google"
    },
    "token": "jwt.access.token",
    "refreshToken": "jwt.refresh.token"
  }
}
```

### 1.6 Refresh token

POST `/auth/refresh`

Request body:

```json
{
  "refreshToken": "jwt.refresh.token"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "token": "new.access.token",
    "refreshToken": "new.refresh.token"
  }
}
```

### 1.7 Forgot password

POST `/auth/forgot-password`

Request body:

```json
{
  "email": "bongani.nombamba@email.com"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "message": "Password reset email sent"
  }
}
```

### 1.8 Reset password

POST `/auth/reset-password`

Request body:

```json
{
  "token": "reset.token",
  "password": "NewSecurePass123!"
}
```

### 1.9 Logout

POST `/auth/logout`

Headers:

```text
Authorization: Bearer <token>
```

Response:

```json
{
  "success": true,
  "data": {
    "loggedOut": true
  }
}
```

---

## 2. Onboarding & Profile Setup

### 2.1 Complete onboarding

POST `/onboarding/complete`

Request body:

```json
{
  "location": "Johannesburg, South Africa",
  "interests": ["Community", "Events", "Travel"],
  "shareLocation": true,
  "contacts": [
    {
      "name": "Aisha",
      "phone": "+27720000001"
    }
  ],
  "profileImageUrl": "https://cdn.pinkplug.app/users/usr_123/profile.jpg"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "onboardingComplete": true,
    "profileComplete": true
  }
}
```

### 2.2 Get current onboarding status

GET `/onboarding/status`

Response:

```json
{
  "success": true,
  "data": {
    "onboardingComplete": true,
    "profileStep": 5,
    "progress": 100
  }
}
```

---

## 3. User Profile

### 3.1 Get current user profile

GET `/users/me`

Response:

```json
{
  "success": true,
  "data": {
    "id": "usr_123",
    "firstName": "Bongani",
    "lastName": "Nombamba",
    "name": "Bongani Nombamba",
    "email": "bongani.nombamba@email.com",
    "phone": "+27721234567",
    "city": "Johannesburg",
    "bio": "Community-first explorer.",
    "handle": "bongz",
    "profileImageUrl": "https://cdn.pinkplug.app/users/usr_123/profile.jpg",
    "avatar": "B",
    "profileVisible": true,
    "locationSharing": true,
    "loginAlerts": true,
    "twoFactorEnabled": false
  }
}
```

### 3.2 Update profile

PUT `/users/me`

Request body:

```json
{
  "firstName": "Bongani",
  "lastName": "Nombamba",
  "city": "Cape Town",
  "bio": "Queer-safe travel advocate",
  "handle": "bongz",
  "profileVisible": true,
  "locationSharing": true
}
```

### 3.3 Upload profile image

POST `/users/me/avatar`

Request:

- multipart/form-data
- field: `file`

Response:

```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://cdn.pinkplug.app/users/usr_123/profile.jpg"
  }
}
```

### 3.4 Update security settings

PUT `/users/me/security`

Request body:

```json
{
  "loginAlerts": true,
  "twoFactorEnabled": true,
  "profileVisible": true,
  "locationSharing": true
}
```

### 3.5 Change password

PUT `/users/me/password`

Request body:

```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

### 3.6 Delete account

DELETE `/users/me`

Response:

```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

---

## 4. Emergency Contacts & Trust Network

### 4.1 Get emergency contacts

GET `/users/me/contacts`

Response:

```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": "ct_01",
        "name": "Aisha",
        "phone": "+27720000001",
        "relationship": "Friend",
        "isPrimary": true
      }
    ]
  }
}
```

### 4.2 Create contact

POST `/users/me/contacts`

Request body:

```json
{
  "name": "Aisha",
  "phone": "+27720000001",
  "relationship": "Friend"
}
```

### 4.3 Update contact

PUT `/users/me/contacts/:contactId`

### 4.4 Delete contact

DELETE `/users/me/contacts/:contactId`

---

## 5. Places & Discovery

### 5.1 Get nearby places

GET `/places?category=all&nearby=true&lat=-26.2041&lng=28.0473&radiusKm=5`

Response:

```json
{
  "success": true,
  "data": {
    "places": [
      {
        "id": "pl_101",
        "name": "The Pink Room",
        "category": "party",
        "address": "Braamfontein, Johannesburg",
        "distance": "0.8 km",
        "rating": 4.8,
        "safetyScore": 96,
        "verifications": ["queer_owned", "community_verified"],
        "latitude": -26.2023,
        "longitude": 28.0408,
        "imageUrl": "https://cdn.pinkplug.app/places/pl_101.jpg"
      }
    ]
  }
}
```

### 5.2 Get place by id

GET `/places/:placeId`

Response:

```json
{
  "success": true,
  "data": {
    "id": "pl_101",
    "name": "The Pink Room",
    "category": "party",
    "address": "Braamfontein, Johannesburg",
    "description": "Safe nightlife venue for queer community events.",
    "rating": 4.8,
    "safetyScore": 96,
    "verifications": ["queer_owned", "community_verified"],
    "hours": "Mon-Sun: 18:00-02:00",
    "website": "https://example.com",
    "phone": "+27110000000",
    "latitude": -26.2023,
    "longitude": 28.0408
  }
}
```

### 5.3 Save / unsave a place

POST `/users/me/saved-places/:placeId`

DELETE `/users/me/saved-places/:placeId`

### 5.4 Get saved places

GET `/users/me/saved-places`

---

## 6. Events

### 6.1 Get events

GET `/events?city=Johannesburg&category=community`

Response:

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "ev_201",
        "title": "Queer Creative Social",
        "date": "2026-09-15T18:00:00Z",
        "location": "Maboneng, Johannesburg",
        "imageUrl": "https://cdn.pinkplug.app/events/ev_201.jpg",
        "attendeeCount": 142,
        "category": "community",
        "isFeatured": true
      }
    ]
  }
}
```

### 6.2 Get event by id

GET `/events/:eventId`

### 6.3 RSVP to event

POST `/events/:eventId/rsvp`

Request body:

```json
{
  "status": "going"
}
```

Supported statuses:

- `going`
- `interested`
- `not_going`

---

## 7. Route Planner & Map

### 7.1 Get route suggestions

POST `/routes/suggestions`

Request body:

```json
{
  "origin": {
    "lat": -26.2041,
    "lng": 28.0473
  },
  "destination": {
    "lat": -26.1957,
    "lng": 28.0596
  },
  "mode": "walking",
  "travelPreferences": ["safe_route", "queer_friendly"]
}
```

Response:

```json
{
  "success": true,
  "data": {
    "route": {
      "id": "rt_301",
      "distanceKm": 1.1,
      "durationMinutes": 12,
      "safetyScore": 96,
      "safeRoute": true,
      "waypoints": [
        { "id": "wp_1", "lat": -26.2041, "lng": 28.0473 },
        { "id": "wp_2", "lat": -26.2014, "lng": 28.0501 }
      ]
    }
  }
}
```

### 7.2 Share live location

POST `/users/me/location/share`

Request body:

```json
{
  "enabled": true,
  "shareWith": ["route_partner", "trusted_contacts"],
  "latitude": -26.2041,
  "longitude": 28.0473,
  "lastUpdatedAt": "2026-09-11T09:20:00Z"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "enabled": true,
    "status": "live",
    "lastUpdatedAt": "2026-09-11T09:20:00Z"
  }
}
```

### 7.3 Stop sharing location

POST `/users/me/location/share`

Request body:

```json
{
  "enabled": false
}
```

### 7.4 Get current route session

GET `/routes/current`

---

## 8. Community Feed & Post Interactions

### 8.1 Get community feed

GET `/community/feed`

Response:

```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "po_401",
        "author": {
          "id": "usr_123",
          "name": "Lerato Khumalo",
          "avatarUrl": "https://cdn.pinkplug.app/users/usr_123/profile.jpg"
        },
        "text": "Safe route update around Florida Road.",
        "location": "Cape Town",
        "createdAt": "2026-09-11T08:30:00Z",
        "commentsCount": 14,
        "likesCount": 40,
        "shares": ["email", "facebook", "instagram"],
        "isLiked": false
      }
    ]
  }
}
```

### 8.2 Create post

POST `/community/posts`

Request body:

```json
{
  "text": "New safe route update for tonight.",
  "location": "Cape Town",
  "shareChannels": ["email", "instagram"]
}
```

### 8.3 Comment on post

POST `/community/posts/:postId/comments`

Request body:

```json
{
  "text": "Thanks for sharing this."
}
```

### 8.4 Like / unlike post

POST `/community/posts/:postId/like`

DELETE `/community/posts/:postId/like`

### 8.5 Share post

POST `/community/posts/:postId/share`

Request body:

```json
{
  "channel": "email"
}
```

Supported channels:

- `email`
- `facebook`
- `twitter`
- `linkedin`
- `instagram`

---

## 9. Messaging & Chat

### 9.1 Get conversations

GET `/messages/conversations`

Response:

```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "conv_01",
        "participant": {
          "id": "usr_555",
          "name": "Lerato Khumalo",
          "avatarUrl": "https://cdn.pinkplug.app/users/usr_555/profile.jpg"
        },
        "preview": "I can show you a few safe nightlife spots.",
        "unreadCount": 2,
        "updatedAt": "2026-09-11T09:12:00Z"
      }
    ]
  }
}
```

### 9.2 Get conversation thread

GET `/messages/conversations/:conversationId`

Response:

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_01",
        "from": "them",
        "text": "Hey! I just posted a safety update near Florida Road.",
        "time": "2026-09-11T09:14:00Z"
      }
    ]
  }
}
```

### 9.3 Send message

POST `/messages/conversations/:conversationId/messages`

Request body:

```json
{
  "text": "Thanks, I will keep that in mind for tonight."
}
```

### 9.4 Create conversation from phone contacts

POST `/messages/conversations`

Request body:

```json
{
  "contactId": "contact_678",
  "firstName": "Sipho",
  "lastName": "Dlamini"
}
```

---

## 10. Notifications

### 10.1 Get notifications

GET `/notifications`

Response:

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_1",
        "title": "Route update",
        "detail": "Your safe route is 3 min away from your next stop.",
        "time": "2m ago",
        "read": false
      }
    ]
  }
}
```

### 10.2 Mark notification as read

PATCH `/notifications/:notificationId/read`

---

## 11. Safety Features

### 11.1 Get emergency resources

GET `/safety/resources`

Response:

```json
{
  "success": true,
  "data": {
    "resources": [
      {
        "id": "safety_1",
        "label": "Call emergency services",
        "action": "tel:+911"
      },
      {
        "id": "safety_2",
        "label": "Share my location",
        "action": "share_location"
      }
    ]
  }
}
```

### 11.2 Trigger SOS / emergency alert

POST `/safety/sos`

Request body:

```json
{
  "location": {
    "latitude": -26.2041,
    "longitude": 28.0473
  },
  "message": "I need help and am sharing my current location."
}
```

Response:

```json
{
  "success": true,
  "data": {
    "alertSent": true,
    "contactsNotified": 3,
    "emergencyServicesContacted": false
  }
}
```

---

## 12. Search, Directory & Travel

### 12.1 Directory search

GET `/directory?query=queer-safe+clinic`

### 12.2 Travel suggestions

GET `/travel/options?from=Johannesburg&to=Cape+Town`

### 12.3 Nearby recommendations

GET `/discover/nearby?lat=-26.2041&lng=28.0473`

---

## 13. Data Models

### User

```json
{
  "id": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "city": "string",
  "bio": "string",
  "avatarUrl": "string",
  "profileVisible": true,
  "locationSharing": true,
  "onboardingComplete": true,
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Place

```json
{
  "id": "string",
  "name": "string",
  "category": "stay | eat | drink | party | shop | culture | wellness | services",
  "address": "string",
  "distance": "string",
  "rating": 4.8,
  "safetyScore": 96,
  "verifications": ["queer_owned", "queer_friendly", "community_verified"],
  "latitude": -26.2041,
  "longitude": 28.0473,
  "description": "string"
}
```

### Event

```json
{
  "id": "string",
  "title": "string",
  "date": "datetime",
  "location": "string",
  "imageUrl": "string",
  "category": "string",
  "attendeeCount": 142,
  "description": "string"
}
```

### Post

```json
{
  "id": "string",
  "authorId": "string",
  "text": "string",
  "location": "string",
  "createdAt": "datetime",
  "likesCount": 0,
  "commentsCount": 0,
  "shareChannels": ["email", "instagram"]
}
```

### Message

```json
{
  "id": "string",
  "conversationId": "string",
  "from": "me | them",
  "text": "string",
  "createdAt": "datetime"
}
```

---

## 14. Security & Privacy Requirements

- All authenticated routes require JWT bearer tokens.
- Location sharing is opt-in and should be clearly consented to by the user.
- Sensitive routes like SOS and live location sharing should require additional confirmation or trusted-device checks.
- Profile photos and uploaded media should use signed URLs or secure object storage.
- Never expose raw private contact information without user consent.
- all user-generated content should include moderation support.

---

## 15. App-specific Notes for Implementation

This app currently includes the following user flows that the backend should support:

- Splash screen and onboarding redirect
- Registration + email OTP verification
- Login with email, Gmail, Apple, and biometric simulation
- Profile setup with location, interests, contacts, and avatar upload
- Route planner with safe recommendations and live sharing
- Map pins with place details and share/open actions
- Community posts with comments and social sharing
- Messages and contact selection from phone contacts
- SOS and emergency support flows
- Settings for location sharing, profile visibility, login alerts, and password management

---

## 16. Suggested implementation checklist

1. Auth service with JWT refresh flow
2. User profile service with upload support
3. Contact management service
4. Places and events indexing with filters and safety metadata
5. Route engine with mode and safety scoring
6. Community feed and comments service
7. Message and conversation service
8. Notification service
9. SOS and live location alert pipeline
10. Audit logging for user security actions

---

## 17. Example backend directory structure

```text
api/
  auth/
  users/
  onboarding/
  places/
  events/
  routes/
  community/
  messages/
  notifications/
  safety/
  uploads/
```

This structure is recommended to keep the API aligned with the app’s domain model and route flows.
