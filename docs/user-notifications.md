# User Frontend Notification Docs

This frontend already has a shared authenticated API client in [src/api/apiClient.ts](../src/api/apiClient.ts), so notification requests should use the same `userApi` instance. A ready-to-use notification client is available in [src/api/notificationApi.ts](../src/api/notificationApi.ts).

## Auth

Send `Authorization: Bearer <userJwt>` on every request.

- Frontend should not send `userId`.
- Backend resolves the current user from the JWT subject.
- If the token is expired, the existing interceptor in `apiClient.ts` will try refresh and otherwise redirect to `/login`.

## Endpoints

### `GET /api/notifications/my`

Purpose: load the bell dropdown or notification center list.

Returns:

- user-specific notifications
- active global notifications
- newest first
- expired notifications are automatically hidden

Example response:

```json
[
  {
    "id": 21,
    "title": "Payment Successful",
    "message": "Your payment for order #101 was completed successfully.",
    "type": "PAYMENT_SUCCESS",
    "targetUrl": "/orders/101",
    "read": false,
    "global": false,
    "createdAt": "2026-05-12T11:25:00",
    "expiresAt": null
  },
  {
    "id": 12,
    "title": "New Collection Launched",
    "message": "Explore our latest floral textile collection.",
    "type": "NEW_COLLECTION",
    "targetUrl": "/designs/new-arrivals",
    "read": false,
    "global": true,
    "createdAt": "2026-05-12T11:20:00",
    "expiresAt": "2026-06-01T00:00:00"
  }
]
```

Field meanings:

- `id`: notification identifier
- `title`: short heading
- `message`: body text
- `type`: notification category enum
- `targetUrl`: optional in-app redirect path
- `read`: current user's read state
- `global`: whether the notification was broadcast to all users
- `createdAt`: creation timestamp
- `expiresAt`: optional expiry timestamp

### `GET /api/notifications/unread-count`

Purpose: load the bell badge number.

Example response:

```json
{
  "count": 5
}
```

### `PATCH /api/notifications/{notificationId}/read`

Purpose: mark one notification as read.

Example:

```http
PATCH /api/notifications/21/read
```

Response: `200 OK` with empty body.

Recommended behavior:

- set local item state to `read: true` optimistically
- call the API
- decrement the local unread count
- navigate to `targetUrl` after success

### `PATCH /api/notifications/read-all`

Purpose: mark all notifications as read for the current user.

Response: `200 OK` with empty body.

## Supported Types

```ts
export type NotificationType =
  | "ORDER_PURCHASE"
  | "PAYMENT_SUCCESS"
  | "DESIGN_DOWNLOAD"
  | "NEW_COLLECTION"
  | "SPECIAL_OFFER"
  | "CREDIT_LOW"
  | "DESIGN_LIMIT_LOW"
  | "SUBSCRIPTION_ACTIVATED"
  | "SUBSCRIPTION_EXPIRING"
  | "SUBSCRIPTION_EXPIRED"
  | "SYSTEM";
```

Suggested UI mapping:

- `PAYMENT_SUCCESS`: payment/check icon
- `DESIGN_DOWNLOAD`: download icon
- `NEW_COLLECTION`: sparkle or grid icon
- `SPECIAL_OFFER`: tag icon
- `CREDIT_LOW`: warning icon
- `DESIGN_LIMIT_LOW`: warning icon
- `SUBSCRIPTION_*`: calendar or membership icon
- `SYSTEM`: bell or info icon
- `ORDER_PURCHASE`: shopping bag or order icon

## Frontend Model

```ts
export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  targetUrl?: string | null;
  read: boolean;
  global: boolean;
  createdAt: string;
  expiresAt?: string | null;
}

export interface UnreadCountResponse {
  count: number;
}
```

## API Client

Use the shared authenticated admin-service client from `userApi`.

```ts
import { userApi } from "./apiClient";

export const getMyNotifications = () =>
  userApi.get<AppNotification[], AppNotification[]>("/notifications/my");

export const getUnreadCount = () =>
  userApi.get<UnreadCountResponse, UnreadCountResponse>("/notifications/unread-count");

export const markNotificationRead = (id: number) =>
  userApi.patch(`/notifications/${id}/read`);

export const markAllNotificationsRead = () =>
  userApi.patch("/notifications/read-all");
```

## Recommended UX Flow

### Navbar bell

This project's main customer header is [src/components/layout/Header.tsx](../src/components/layout/Header.tsx). The notification bell badge can be integrated there beside wishlist/cart.

- on app load, call unread count
- if count is greater than `0`, show a badge
- refresh every `30-60` seconds, or refresh on route change and window focus

### Bell dropdown

- on open, call `GET /api/notifications/my`
- show top `5-10` most recent items
- highlight unread notifications
- include a `View all` CTA to a dedicated notifications page if you add one later

### Notification click

- call `PATCH /api/notifications/{id}/read`
- update local state immediately
- if `targetUrl` exists, navigate there after success
- if `targetUrl` is missing, keep the item non-navigable or open details inline

### Notification center page

No page exists yet in this repo, so if you add one it can sit behind the same authenticated routing used by `/orders`, `/profile`, and `/wishlist`.

- load full list using `GET /api/notifications/my`
- filter read/unread client-side
- wire `Mark all as read` to `PATCH /api/notifications/read-all`

## UI Rules

- use a visible background or border accent for unread items
- format `createdAt` as relative time such as `2m ago`, `3h ago`, `2d ago`
- truncate long messages in dropdown, but show full text in a full-page list
- treat `targetUrl: null` as informational only

## Error Handling

- `401 Unauthorized`: session expired, allow the interceptor-driven re-login flow
- `404 Not Found` on mark-read: notification missing or not owned by current user
- `500 Internal Server Error`: show a toast such as `Unable to load notifications`

## Behavior Note

Global notifications still maintain per-user read state. If one user reads a global notification, it does not affect any other user.

## Suggested Route Targets In This Repo

Some backend `targetUrl` values can map cleanly to routes already present in [src/App.tsx](../src/App.tsx):

- `/orders/:orderId` for payment/order events
- `/subscription` for subscription lifecycle events
- `/gallery` or `/ai-studio/gallery` for design-related updates
- `/special-offers/explore` for promotional messages
- `/trends/explore` or `/fabrics/explore` for collection-style campaigns

The sample backend value `/designs/new-arrivals` is not currently a registered route in this app, so that path should be aligned with an existing route before wiring click navigation.
