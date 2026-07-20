# FixItNow Backend — API Testing Guide

A complete reference for testing every API endpoint in the FixItNow-Backend project with Postman.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Conventions](#conventions)
- [Standard Response Format](#standard-response-format)
- [Authentication](#authentication)
- [Health](#health)
- [Authentication Module](#authentication-module)
- [Services Module](#services-module)
- [Technicians (Public Listing) Module](#technicians-public-listing-module)
- [Technician (Self-Service) Module](#technician-self-service-module)
- [Bookings Module](#bookings-module)
- [Payments Module](#payments-module)
- [Reviews Module](#reviews-module)
- [Admin Module](#admin-module)
- [Categories Module](#categories-module)
- [Postman Testing Checklist](#postman-testing-checklist)

---

## Getting Started

### Environment Setup

1. Copy `.env.example` to `.env` and fill in real values:

   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL=postgresql://user:password@host:port/dbname?sslmode=require
   JWT_SECRET=your_access_token_secret
   JWT_EXPIRES_IN=1d
   JWT_REFRESH_SECRET=your_refresh_token_secret
   JWT_REFRESH_EXPIRES_IN=7d
   STRIPE_SECRET_KEY=sk_test_xxx
   STRIPE_PUBLIC_KEY=pk_test_xxx
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   FRONTEND_URL=http://localhost:3000
   CLIENT_URL=http://localhost:3000
   ```

2. Install dependencies, run migrations, and seed the database:

   ```bash
   npm install
   npx prisma migrate deploy
   npx prisma db seed
   npm run dev
   ```

3. The server runs at `http://localhost:5000` (default `PORT=5000`).

### Postman Environment Variables

Create a Postman environment with these variables:

| Variable          | Initial Value                  |
| ----------------- | ------------------------------ |
| `baseUrl`         | `http://localhost:5000/api`    |
| `accessToken`     | *(set automatically)*          |
| `refreshToken`    | *(set automatically)*          |
| `customerId`      |                                |
| `technicianId`    |                                |
| `adminId`         |                                |
| `serviceId`       |                                |
| `categoryId`      |                                |
| `bookingId`       |                                |
| `paymentId`       |                                |

> **Important:** Authentication uses **HTTP-only cookies** (`accessToken` and `refreshToken`). In Postman, enable **Automatically persist cookies** (Settings → General) so cookies are stored and sent automatically across requests.

---

## Conventions

- **Base URL:** `{{baseUrl}}` → `http://localhost:5000/api`
- **Auth:** Cookie-based. The `accessToken` cookie is sent automatically by Postman once login succeeds. No manual `Authorization` header is required (the `auth()` middleware reads `req.cookies.accessToken`).
- **Roles:** `CUSTOMER`, `TECHNICIAN`, `ADMIN` (see [`enums.prisma`](prisma/schema/enums.prisma:1)).
- **User status:** `ACTIVE`, `BANNED`. Banned users are blocked from all authenticated routes and from login/refresh.
- **All `:id` route parameters must be valid UUIDs** (validated by [`idParamValidationSchema`](src/validations/index.ts:3)).

---

## Standard Response Format

All responses use [`sendResponse`](src/utils/sendResponse.ts:12):

**Success:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resource retrieved successfully!",
  "meta": { "page": 1, "limit": 10, "total": 25, "totalPage": 3 },
  "data": { ... }
}
```

**Error** (see [`globalErrorHandler.ts`](src/middlewares/globalErrorHandler.ts:46)):

```json
{
  "success": false,
  "message": "Validation error",
  "errorSources": [{ "path": "body.email", "message": "Invalid email address" }],
  "stack": "..." 
}
```

> `stack` is only included when `NODE_ENV=development`.

---

## Authentication

The [`auth()` middleware](src/middlewares/auth.ts:7) performs these checks in order:

1. Reads `accessToken` from cookies → `401` if missing.
2. Verifies the JWT → `401` if invalid/expired.
3. Looks up the user → `401` if user no longer exists.
4. Checks `status === "BANNED"` → `403`.
5. Checks role against `requiredRoles` → `403` if not permitted.

Tokens are issued as **HTTP-only cookies** on login and refresh (see [`auth.controller.ts`](src/modules/auth/auth.controller.ts:17)).

---

## Health

### `GET /api/health`

| Property | Value |
| -------- | ----- |
| Method   | GET |
| Path     | `/api/health` |
| Auth     | None |
| Params   | None |
| Body     | None |

**Description:** Health check. Returns `{ status: "ok", message: "Database is connected" }`. Use this to confirm the server is running before testing other endpoints.

---

## Authentication Module

Routes mounted at `/api/auth` (see [`auth.route.ts`](src/modules/auth/auth.route.ts:9)).

### `POST /api/auth/register`

| Property | Value |
| -------- | ----- |
| Method   | POST |
| Path     | `/api/auth/register` |
| Auth     | None |
| Body     | Required |

**Description:** Registers a new user. If `role` is `TECHNICIAN`, an empty `TechnicianProfile` is auto-created. Password is hashed with bcrypt. Returns `201`.

**Request body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "role": "CUSTOMER"
}
```

| Field     | Type   | Rules                                            |
| --------- | ------ | ------------------------------------------------ |
| `name`    | string | required, min 1 char                             |
| `email`   | string | required, valid email                            |
| `password`| string | required, min 6 chars                           |
| `role`    | enum   | required, `CUSTOMER` or `TECHNICIAN`             |

**Errors:** `409` if email already exists; `400` on validation failure.

---

### `POST /api/auth/login`

| Property | Value |
| -------- | ----- |
| Method   | POST |
| Path     | `/api/auth/login` |
| Auth     | None |
| Body     | Required |

**Description:** Authenticates a user and sets `accessToken` + `refreshToken` HTTP-only cookies. Returns the user object (without password).

**Request body:**

```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

| Field      | Type   | Rules          |
| ---------- | ------ | -------------- |
| `email`    | string | required, email |
| `password` | string | required       |

**Errors:** `404` user not found; `403` if banned; `401` invalid password.

---

### `GET /api/auth/me`

| Property | Value |
| -------- | ----- |
| Method   | GET |
| Path     | `/api/auth/me` |
| Auth     | CUSTOMER, TECHNICIAN, ADMIN |
| Params   | None |
| Body     | None |

**Description:** Returns the currently authenticated user's profile (without password).

**Errors:** `404` if user not found; `401` if not authenticated.

---

### `POST /api/auth/logout`

| Property | Value |
| -------- | ----- |
| Method   | POST |
| Path     | `/api/auth/logout` |
| Auth     | CUSTOMER, TECHNICIAN, ADMIN |
| Body     | None |

**Description:** Clears the `accessToken` and `refreshToken` cookies. Returns `200` with `data: null`.

---

### `POST /api/auth/refresh`

| Property | Value |
| -------- | ----- |
| Method   | POST |
| Path     | `/api/auth/refresh` |
| Auth     | None (uses `refreshToken` cookie) |
| Body     | None |

**Description:** Issues a new access token (and rotates the refresh token) using the `refreshToken` cookie. Sets new cookies.

**Errors:** `401` if refresh token missing, invalid, or expired; `404` if user not found; `403` if banned.

---

## Services Module

Routes mounted at `/api/services` (see [`service.route.ts`](src/modules/service/service.route.ts:11)).

### `GET /api/services`

| Property | Value |
| -------- | ----- |
| Method   | GET |
| Path     | `/api/services` |
| Auth     | None |
| Query    | Optional (pagination, filtering, search) |

**Description:** Paginated, filterable list of services. Includes category and technician profile info.

**Query parameters:**

| Param        | Type   | Description                                  |
| ------------ | ------ | -------------------------------------------- |
| `page`       | string | Page number (default `1`)                    |
| `limit`      | string | Items per page (default `10`, max `100`)     |
| `sortBy`     | string | Field to sort by (default `createdAt`)       |
| `sortOrder`  | string | `asc` or `desc` (default `desc`)            |
| `search`     | string | Case-insensitive search on title/description |
| `categoryId` | string | Filter by category UUID                      |
| `minPrice`   | string | Minimum price (inclusive)                   |
| `maxPrice`   | string | Maximum price (inclusive)                   |

**Example:** `GET /api/services?page=1&limit=5&search=ac&minPrice=50&sortBy=price&sortOrder=asc`

---

### `GET /api/services/categories`

| Property | Value |
| -------- | ----- |
| Method   | GET |
| Path     | `/api/services/categories` |
| Auth     | None |
| Query    | `sortBy` (optional: `name` or `createdAt`) |

**Description:** Public list of categories with a `_count` of services per category. Different from the admin categories endpoint.

---

### `GET /api/services/:id`

| Property | Value |
| -------- | ----- |
| Method   | GET |
| Path     | `/api/services/:id` |
| Auth     | None |
| Params   | `id` (UUID) |

**Description:** Fetch a single service by ID with category and technician profile.

**Errors:** `400` invalid UUID; `404` service not found.

---

### `POST /api/services`

| Property | Value |
| -------- | ----- |
| Method   | POST |
| Path     | `/api/services` |
| Auth     | TECHNICIAN |
| Body     | Required |

**Description:** Creates a service owned by the authenticated technician. Returns `201`.

**Request body:**

```json
{
  "title": "AC Repair",
  "description": "Full AC servicing and gas refill",
  "price": 120.5,
  "categoryId": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Field         | Type   | Rules                          |
| ------------- | ------ | ------------------------------ |
| `title`       | string | required, min 3 chars          |
| `description` | string | required                       |
| `price`       | number | required, non-negative         |
| `categoryId`  | string | required, must exist           |

**Errors:** `404` technician profile not found; `404` category not found; `400` validation.

---

### `PATCH /api/services/:id`

| Property | Value |
| -------- | ----- |
| Method   | PATCH |
| Path     | `/api/services/:id` |
| Auth     | TECHNICIAN (owner only) |
| Params   | `id` (UUID) |
| Body     | Optional (all fields optional) |

**Description:** Updates a service. Only the owning technician can update it.

**Request body (all optional):**

```json
{
  "title": "AC Repair & Maintenance",
  "description": "Updated description",
  "price": 150,
  "categoryId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Errors:** `404` service/category not found; `403` not the owner; `400` invalid UUID/validation.

---

### `DELETE /api/services/:id`

| Property | Value |
| -------- | ----- |
| Method   | DELETE |
| Path     | `/api/services/:id` |
| Auth     | TECHNICIAN (owner only) |
| Params   | `id` (UUID) |

**Description:** Deletes a service. Only the owning technician can delete it.

**Errors:** `404` service not found; `403` not the owner; `400` invalid UUID.

---

## Technicians (Public Listing) Module

Routes mounted at `/api/services/technicians` (see [`technician.route.ts`](src/modules/technician/technician.route.ts:41)).

### `GET /api/services/technicians`

| Property | Value |
| -------- | ----- |
| Method   | GET |
| Path     | `/api/services/technicians` |
| Auth     | None |
| Query    | Optional (pagination, filtering) |

**Description:** Paginated list of **active** technician profiles (banned users excluded).

**Query parameters:**

| Param           | Type   | Description                              |
| --------------- | ------ | ---------------------------------------- |
| `page`          | string | Page number (default `1`)                |
| `limit`         | string | Items per page (default `10`, max `100`) |
| `sortBy`        | string | Sort field (default `createdAt`)         |
| `sortOrder`     | string | `asc` or `desc`                          |
| `location`      | string | Case-insensitive location contains      |
| `minRating`     | string | Minimum average rating (inclusive)      |
| `minHourlyRate` | string | Minimum hourly rate (inclusive)          |
| `maxHourlyRate` | string | Maximum hourly rate (inclusive)         |

---

### `GET /api/services/technicians/:id`

| Property | Value |
| -------- | ----- |
| Method   | GET |
| Path     | `/api/services/technicians/:id` |
| Auth     | None |
| Params   | `id` (UUID — technician profile ID) |

**Description:** Fetch a technician profile by ID, including their services and reviews.

**Errors:** `400` invalid UUID; `404` technician not found.

---

## Technician (Self-Service) Module

Routes mounted at `/api/technician` (see [`technician.route.ts`](src/modules/technician/technician.route.ts:11)). All require `TECHNICIAN` role.

### `GET /api/technician/bookings`

| Property | Value |
| -------- | ----- |
| Method   | GET |
| Path     | `/api/technician/bookings` |
| Auth     | TECHNICIAN |
| Params   | None |

**Description:** Returns all bookings assigned to the authenticated technician, ordered by `createdAt desc`.

**Errors:** `404` technician profile not found.

---

### `PATCH /api/technician/bookings/:id`

| Property | Value |
| -------- | ----- |
| Method   | PATCH |
| Path     | `/api/technician/bookings/:id` |
| Auth     | TECHNICIAN (assigned to booking) |
| Params   | `id` (UUID — booking ID) |
| Body     | Required |

**Description:** Updates the status of a booking assigned to the technician. Allowed statuses: `ACCEPTED`, `DECLINED`, `IN_PROGRESS`, `COMPLETED`.

**Request body:**

```json
{
  "status": "ACCEPTED"
}
```

| Field    | Type | Rules                                                              |
| -------- | ---- | ------------------------------------------------------------------ |
| `status` | enum | required, one of `ACCEPTED`, `DECLINED`, `IN_PROGRESS`, `COMPLETED` |

**Errors:** `404` booking/technician not found; `403` not assigned; `400` invalid status/UUID.

> **Note:** The service layer does not enforce the [`VALID_TRANSITIONS`](src/modules/booking/bookingStatus.ts:4) map here — only the customer's cancel path calls `assertTransition`. See the checklist for transition testing notes.

---

### `PUT /api/technician/profile`

| Property | Value |
| -------- | ----- |
| Method   | PUT |
| Path     | `/api/technician/profile` |
| Auth     | TECHNICIAN |
| Body     | Optional (all fields optional) |

**Description:** Updates the technician's own profile.

**Request body (all optional):**

```json
{
  "bio": "Certified HVAC technician with 10 years experience",
  "skills": ["AC Repair", "Refrigeration", "Heating"],
  "experience": 10,
  "hourlyRate": 45.5,
  "location": "Dhaka, Bangladesh"
}
```

| Field        | Type     | Rules              |
| ------------ | -------- | ------------------ |
| `bio`        | string   | optional           |
| `skills`     | string[] | optional           |
| `experience` | integer  | optional           |
| `hourlyRate` | number   | optional           |
| `location`   | string   | optional           |

---

### `PUT /api/technician/availability`

| Property | Value |
| -------- | ----- |
| Method   | PUT |
| Path     | `/api/technician/availability` |
| Auth     | TECHNICIAN |
| Body     | Required |

**Description:** Updates the technician's availability schedule (stored as JSON).

**Request body:**

```json
{
  "availability": {
    "monday": ["09:00-12:00", "14:00-18:00"],
    "tuesday": ["09:00-17:00"],
    "wednesday": []
  }
}
```

| Field           | Type                          | Rules    |
| --------------- | ----------------------------- | -------- |
| `availability`  | object (string → string array) | required |

---

## Bookings Module

Routes mounted at `/api/bookings` (see [`booking.route.ts`](src/modules/booking/booking.route.ts:11)).

### `POST /api/bookings`

| Property | Value |
| -------- | ----- |
| Method   | POST |
| Path     | `/api/bookings` |
| Auth     | CUSTOMER |
| Body     | Required |

**Description:** Creates a new booking with status `REQUESTED`. The `servicePrice` is copied from the service at creation time, and the `technicianProfileId` is derived from the booked service (the technician who owns the service) — the client does **not** send it.

**Request body:**

```json
{
  "serviceId": "550e8400-e29b-41d4-a716-446655440000",
  "scheduledDate": "2026-07-10",
  "timeSlot": "10:00-12:00",
  "contactNumber": "+8801712345678"
}
```

| Field            | Type   | Rules                                  |
| ---------------- | ------ | -------------------------------------- |
| `serviceId`      | string | required, must exist                    |
| `scheduledDate`  | string | required, valid date (parseable by JS) |
| `timeSlot`       | string | required                                |
| `contactNumber`  | string | required                                |

**Errors:** `404` service not found; `400` validation.

---

### `GET /api/bookings`

| Property | Value |
| -------- | ----- |
| Method   | GET |
| Path     | `/api/bookings` |
| Auth     | CUSTOMER, TECHNICIAN, ADMIN |
| Query    | Optional (pagination) |

**Description:** Paginated list of bookings, **scoped by role**:
- `CUSTOMER` → only their own bookings (`customerId`).
- `TECHNICIAN` → only bookings assigned to their profile.
- `ADMIN` → all bookings.

**Query parameters:**

| Param       | Type   | Description                              |
| ----------- | ------ | ---------------------------------------- |
| `page`      | string | Page number (default `1`)                |
| `limit`     | string | Items per page (default `10`, max `100`) |
| `sortBy`    | string | Sort field (default `createdAt`)         |
| `sortOrder` | string | `asc` or `desc`                          |

---

### `GET /api/bookings/:id`

| Property | Value |
| -------- | ----- |
| Method   | GET |
| Path     | `/api/bookings/:id` |
| Auth     | CUSTOMER, TECHNICIAN, ADMIN |
| Params   | `id` (UUID) |

**Description:** Fetch a single booking. Ownership is enforced: only the booking's customer, the assigned technician, or an admin can view it.

**Errors:** `404` booking not found; `403` not authorized; `400` invalid UUID.

---

### `PATCH /api/bookings/:id/cancel`

| Property | Value |
| -------- | ----- |
| Method   | PATCH |
| Path     | `/api/bookings/:id/cancel` |
| Auth     | CUSTOMER (booking owner) |
| Params   | `id` (UUID) |
| Body     | `{ "reason": "Booked by mistake" }` (`reason` is **required**) |

**Description:** Cancels a booking owned by the authenticated customer. The `reason` is required and stored on the booking as `cancellationReason`. Behaviour depends on the booking/payment state:

| Case | Booking status | Payment status | Result |
| ---- | -------------- | -------------- | ------ |
| 1 | `ACCEPTED` | `PENDING` | Cancelled, **no refund**, payment stays `PENDING`. |
| 2 | `PAID` | `COMPLETED` | **Stripe refund** issued via the saved `transactionId`; booking → `CANCELLED`, payment → `REFUNDED` (atomic Prisma transaction). |
| 3 | `IN_PROGRESS` | — | `400` "Booking cannot be cancelled after the service has started." |
| 4 | `COMPLETED` | — | `400` "Completed bookings cannot be cancelled." |
| 5 | `CANCELLED` | — | `400` "Booking has already been cancelled." |

> `REQUESTED → CANCELLED` is also allowed (no payment/refund). The [`VALID_TRANSITIONS`](src/modules/booking/bookingStatus.ts:4) state machine is still enforced as a final guard.

**Errors:** `404` booking not found; `403` not the owner; `400` cannot be cancelled (cases 3–5); `400` invalid UUID; `400` missing `reason`.

---

## Payments Module

Routes mounted at `/api/payments` (see [`payment.route.ts`](src/modules/payment/payment.route.ts:11)).

### `POST /api/payments/webhook`

| Property | Value |
| -------- | ----- |
| Method   | POST |
| Path     | `/api/payments/webhook` |
| Auth     | None (Stripe signature verification) |
| Headers  | `stripe-signature` (required) |
| Body     | Raw body (NOT parsed as JSON) |

**Description:** Stripe webhook endpoint. Registered **before** `express.json()` in [`app.ts`](src/app.ts:24), so it receives the raw body. Verifies the `stripe-signature` header against `STRIPE_WEBHOOK_SECRET`.

**Handled events** (see [`payment.service.ts`](src/modules/payment/payment.service.ts:217)):
- `checkout.session.completed` → marks payment `COMPLETED`, stores the Payment Intent / transaction ID, sets booking to `PAID`. Only fires when `session.payment_status` is `paid`. Idempotent — duplicate events for an already-completed payment are ignored (the check runs inside the transaction).
- `checkout.session.async_payment_succeeded` → same handling as `checkout.session.completed` for delayed-payment methods (e.g. bank transfers) that settle after the session is created.
- `checkout.session.async_payment_failed` → marks payment to `FAILED`.
- `charge.refunded` → sets payment to `REFUNDED`, booking to `CANCELLED`. Idempotent — the lookup and `REFUNDED` check run inside the transaction.

**Errors:** `400` missing/invalid signature; `400` verification failed.

> **Postman note:** This endpoint expects a raw Stripe event payload. For local testing, use the Stripe CLI (`stripe listen --forward-to localhost:5000/api/payments/webhook`).

---

### `POST /api/payments/checkout`

| Property | Value |
| -------- | ----- |
| Method   | POST |
| Path     | `/api/payments/checkout` |
| Auth     | CUSTOMER |
| Body     | Required |

**Description:** Creates a Stripe Hosted Checkout Session for a booking. The booking **must be in `ACCEPTED` status** and not already paid. The payment amount is derived from the booking's `servicePrice`. Returns a `url` the frontend should redirect the customer to, plus the `sessionId`. A `PENDING` payment record is created (or reused) and finalized by the webhook on success.

**Request body:**

```json
{
  "bookingId": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Field       | Type   | Rules          |
| ----------- | ------ | -------------- |
| `bookingId` | string | required       |

**Response body:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Stripe Checkout session created successfully!",
  "data": {
    "url": "https://checkout.stripe.com/c/pay/cs_test_...",
    "sessionId": "cs_test_a1b2c3..."
  }
}
```

**Errors:** `404` booking not found; `403` not the booking owner; `400` booking not `ACCEPTED`; `400` already paid.

---

### `GET /api/payments`

| Property | Value |
| -------- | ----- |
| Method   | GET |
| Path     | `/api/payments` |
| Auth     | CUSTOMER, ADMIN |
| Params   | None |

**Description:** Payment history.
- `CUSTOMER` → only their own payments.
- `ADMIN` → all payments.

---

### `GET /api/payments/:id`

| Property | Value |
| -------- | ----- |
| Method   | GET |
| Path     | `/api/payments/:id` |
| Auth     | CUSTOMER, ADMIN |
| Params   | `id` (UUID — payment ID) |

**Description:** Fetch a single payment. Customers can only view their own payments; admins can view any.

**Errors:** `404` payment not found; `403` not authorized; `400` invalid UUID.

---

## Reviews Module

Routes mounted at `/api/reviews` (see [`review.route.ts`](src/modules/review/review.route.ts:9)).

### `POST /api/reviews`

| Property | Value |
| -------- | ----- |
| Method   | POST |
| Path     | `/api/reviews` |
| Auth     | CUSTOMER |
| Body     | Required |

**Description:** Creates a review for a **completed** booking. Only the booking's customer can review. After creating, the technician's `averageRating` and `totalReviews` are recalculated. Returns `201`.

**Request body:**

```json
{
  "bookingId": "550e8400-e29b-41d4-a716-446655440000",
  "rating": 5,
  "comment": "Excellent service, highly recommended!"
}
```

| Field       | Type    | Rules                          |
| ----------- | ------- | ------------------------------ |
| `bookingId` | string  | required                       |
| `rating`    | integer | required, 1–5                  |
| `comment`   | string  | optional                       |

**Errors:** `404` booking not found; `403` not the booking owner; `400` booking not `COMPLETED`; `400` validation (rating out of range, non-integer).

> **Note:** Because `bookingId` is `@unique` on the `Review` model, attempting to review the same booking twice results in a `409` (Prisma `P2002`).

---

## Admin Module

Routes mounted at `/api/admin` (see [`admin.route.ts`](src/modules/admin/admin.route.ts:11)). All require `ADMIN` role.

### `GET /api/admin/users`

| Property | Value |
| -------- | ----- |
| Method   | GET |
| Path     | `/api/admin/users` |
| Auth     | ADMIN |
| Query    | Optional (pagination) |

**Description:** Paginated list of all users (passwords omitted), including technician profiles.

**Query parameters:** `page`, `limit`, `sortBy`, `sortOrder`.

---

### `PATCH /api/admin/users/:id`

| Property | Value |
| -------- | ----- |
| Method   | PATCH |
| Path     | `/api/admin/users/:id` |
| Auth     | ADMIN |
| Params   | `id` (UUID — user ID) |
| Body     | Required |

**Description:** Toggles a user's status between `ACTIVE` and `BANNED`.

**Request body:**

```json
{
  "status": "BANNED"
}
```

| Field    | Type | Rules                          |
| -------- | ---- | ------------------------------ |
| `status` | enum | required, `ACTIVE` or `BANNED` |

**Errors:** `404` user not found; `400` invalid status/UUID.

---

### `GET /api/admin/bookings`

| Property | Value |
| -------- | ----- |
| Method   | GET |
| Path     | `/api/admin/bookings` |
| Auth     | ADMIN |
| Query    | Optional (pagination) |

**Description:** Paginated list of all bookings (admin sees everything).

**Query parameters:** `page`, `limit`, `sortBy`, `sortOrder`.

---

### `GET /api/admin/bookings/:id`

| Property | Value |
| -------- | ----- |
| Method   | GET |
| Path     | `/api/admin/bookings/:id` |
| Auth     | ADMIN |
| Params   | `id` (UUID) |

**Description:** Fetch a single booking with full details (includes service, customer, technician, payment, and review).

**Errors:** `404` booking not found; `400` invalid UUID.

---

### `GET /api/admin/payments`

| Property | Value |
| -------- | ----- |
| Method   | GET |
| Path     | `/api/admin/payments` |
| Auth     | ADMIN |
| Params   | None |

**Description:** List all payments (ordered by `createdAt desc`), including booking/service/customer info. Not paginated.

---

### `GET /api/admin/payments/:id`

| Property | Value |
| -------- | ----- |
| Method   | GET |
| Path     | `/api/admin/payments/:id` |
| Auth     | ADMIN |
| Params   | `id` (UUID — payment ID) |

**Description:** Fetch a single payment with full booking details.

**Errors:** `404` payment not found; `400` invalid UUID.

---

## Categories Module

Routes mounted at `/api/admin/categories` (see [`category.route.ts`](src/modules/category/category.route.ts:11)). All require `ADMIN` role.

### `GET /api/admin/categories`

| Property | Value |
| -------- | ----- |
| Method   | GET |
| Path     | `/api/admin/categories` |
| Auth     | ADMIN |
| Params   | None |

**Description:** Admin list of all categories with a `_count` of services per category (ordered by `createdAt desc`).

---

### `POST /api/admin/categories`

| Property | Value |
| -------- | ----- |
| Method   | POST |
| Path     | `/api/admin/categories` |
| Auth     | ADMIN |
| Body     | Required |

**Description:** Creates a new category. Returns `201`.

**Request body:**

```json
{
  "name": "Electrical",
  "description": "Electrical repair and installation services"
}
```

| Field         | Type   | Rules              |
| ------------- | ------ | ------------------ |
| `name`        | string | required, unique   |
| `description` | string | optional           |

**Errors:** `409` category name already exists; `400` validation.

---

### `PATCH /api/admin/categories/:id`

| Property | Value |
| -------- | ----- |
| Method   | PATCH |
| Path     | `/api/admin/categories/:id` |
| Auth     | ADMIN |
| Params   | `id` (UUID) |
| Body     | Optional |

**Description:** Updates a category. If `name` changes, uniqueness is re-checked.

**Request body (all optional):**

```json
{
  "name": "Electrical & Wiring",
  "description": "Updated description"
}
```

**Errors:** `404` category not found; `409` name already exists; `400` invalid UUID.

---

### `DELETE /api/admin/categories/:id`

| Property | Value |
| -------- | ----- |
| Method   | DELETE |
| Path     | `/api/admin/categories/:id` |
| Auth     | ADMIN |
| Params   | `id` (UUID) |

**Description:** Deletes a category. **Cannot delete a category that has services assigned to it.**

**Errors:** `404` category not found; `400` category has services; `400` invalid UUID.

---

## Postman Testing Checklist

Use this checklist to systematically test every aspect of the API. Work top-to-bottom; many tests depend on data created in earlier steps.

### 0. Pre-flight

- [ ] `GET /api/health` returns `200` with `{ status: "ok" }`.
- [ ] Confirm Postman cookie jar is enabled (Settings → General → "Automatically persist cookies").

### 1. Authentication — Successful Requests

- [ ] `POST /api/auth/register` with `role: CUSTOMER` → `201`, user object returned, no `password` field.
- [ ] `POST /api/auth/register` with `role: TECHNICIAN` → `201`, response includes an empty `technicianProfile`.
- [ ] `POST /api/auth/login` with valid credentials → `200`, `accessToken` + `refreshToken` cookies set.
- [ ] `GET /api/auth/me` with valid cookie → `200`, returns current user.
- [ ] `POST /api/auth/refresh` with valid `refreshToken` cookie → `200`, new cookies issued.
- [ ] `POST /api/auth/logout` → `200`, both cookies cleared (check `Set-Cookie` headers with expired dates).

### 2. Authentication — Input Validation

- [ ] Register with missing `name` → `400` validation error.
- [ ] Register with invalid `email` → `400` "Invalid email address".
- [ ] Register with `password` < 6 chars → `400`.
- [ ] Register with invalid `role` (e.g., `ADMIN`) → `400` (only `CUSTOMER`/`TECHNICIAN` allowed).
- [ ] Register with duplicate email → `409` "User already exists with this email!".
- [ ] Login with non-existent email → `404` "User not found!".
- [ ] Login with wrong password → `401` "Invalid password!".
- [ ] Login with malformed body (missing fields) → `400`.

### 3. Authentication — Refresh Token Flow

- [ ] Call `/api/auth/refresh` with **no** `refreshToken` cookie → `401` "Refresh token is missing!".
- [ ] Call `/api/auth/refresh` with a **tampered** refresh token → `401` "Invalid or expired refresh token!".
- [ ] Call `/api/auth/refresh` with an **expired** refresh token → `401`.
- [ ] Successful refresh issues **both** a new access token and a new refresh token (rotation) — verify the old refresh token no longer works only if you stored it; note JWTs are stateless so rotation doesn't invalidate the old one server-side.
- [ ] After refresh, the new `accessToken` cookie works on `/api/auth/me`.

### 4. Authentication — Logout & Cookie Clearing

- [ ] After logout, calling `/api/auth/me` → `401` (cookies cleared).
- [ ] Verify `Set-Cookie` response headers on logout contain `Max-Age=0` / expired dates for both tokens.
- [ ] Logout without authentication → `401`.

### 5. Authentication & Authorization (Role-Based Access Control)

- [ ] Access a `TECHNICIAN`-only route (e.g., `GET /api/technician/bookings`) as a `CUSTOMER` → `403` "You have no permission to access this route!".
- [ ] Access an `ADMIN`-only route (e.g., `GET /api/admin/users`) as a `CUSTOMER` → `403`.
- [ ] Access an `ADMIN`-only route as a `TECHNICIAN` → `403`.
- [ ] Access any authenticated route with **no cookie** → `401` "You are not authorized! Token missing.".
- [ ] Access any authenticated route with an **invalid/tampered** access token → `401`.
- [ ] Access any authenticated route with an **expired** access token → `401` (then test refresh restores access).

### 6. Banned User Access Restrictions

- [ ] As admin, ban a user: `PATCH /api/admin/users/:id` with `{ status: "BANNED" }` → `200`.
- [ ] Banned user tries to **login** → `403` "This user account has been banned!".
- [ ] Banned user (with a previously valid access token) hits `/api/auth/me` → `403` "This user account has been banned!".
- [ ] Banned user tries `/api/auth/refresh` → `403`.
- [ ] Banned user tries any role-gated route → `403`.
- [ ] As admin, unban the user (`status: "ACTIVE"`) → user can login again → `200`.

### 7. Categories (Admin)

- [ ] `POST /api/admin/categories` as admin → `201`.
- [ ] `POST` with duplicate name → `409` "Category with this name already exists!".
- [ ] `POST` with missing `name` → `400`.
- [ ] `GET /api/admin/categories` → `200`, list with `_count.services`.
- [ ] `PATCH /api/admin/categories/:id` → `200`, updated.
- [ ] `PATCH` with a name that already exists → `409`.
- [ ] `PATCH` with non-existent UUID → `404`.
- [ ] `DELETE /api/admin/categories/:id` on empty category → `200`.
- [ ] `DELETE` a category that **has services** → `400` "Cannot delete a category that has services assigned to it!".
- [ ] `DELETE` with invalid (non-UUID) `:id` → `400` "Invalid UUID format".
- [ ] Access any category route as non-admin → `403`.

### 8. Services

- [ ] `GET /api/services` (public, no auth) → `200` with `meta` pagination.
- [ ] `GET /api/services/categories` (public) → `200`.
- [ ] `GET /api/services/:id` with valid ID → `200`.
- [ ] `GET /api/services/:id` with non-existent UUID → `404` "Service not found!".
- [ ] `GET /api/services/:id` with **invalid UUID** (e.g., `abc`) → `400` "Invalid UUID format".
- [ ] `POST /api/services` as TECHNICIAN → `201`.
- [ ] `POST` with `title` < 3 chars → `400`.
- [ ] `POST` with negative `price` → `400`.
- [ ] `POST` with non-existent `categoryId` → `404` "Category not found!".
- [ ] `POST` as CUSTOMER → `403`.
- [ ] `PATCH /api/services/:id` as the owning technician → `200`.
- [ ] `PATCH` as a **different** technician → `403` "You are not authorized to update this service!".
- [ ] `PATCH` with non-existent `categoryId` → `404`.
- [ ] `DELETE /api/services/:id` as owner → `200`.
- [ ] `DELETE` as non-owner → `403`.

### 9. Services — Pagination, Filtering & Searching

- [ ] `GET /api/services?page=2&limit=5` → verify `meta.page=2`, `meta.limit=5`, `meta.totalPage` correct.
- [ ] `GET /api/services?limit=200` → capped at `100` (verify `meta.limit=100`).
- [ ] `GET /api/services?limit=0` or negative → defaults/clamped to `1`.
- [ ] `GET /api/services?sortBy=price&sortOrder=asc` → results sorted ascending by price.
- [ ] `GET /api/services?search=ac` → only services with "ac" in title/description (case-insensitive).
- [ ] `GET /api/services?categoryId=<uuid>` → only services in that category.
- [ ] `GET /api/services?minPrice=50&maxPrice=150` → prices within range.
- [ ] `GET /api/services?minPrice=1000` → no results if none match.

### 10. Technicians (Public Listing)

- [ ] `GET /api/services/technicians` (public) → `200` with pagination `meta`.
- [ ] Verify **banned** technicians are excluded (ban a technician, confirm they disappear from the list).
- [ ] `GET /api/services/technicians?location=Dhaka` → filtered by location (case-insensitive contains).
- [ ] `GET /api/services/technicians?minRating=4` → only rating ≥ 4.
- [ ] `GET /api/services/technicians?minHourlyRate=20&maxHourlyRate=80` → within range.
- [ ] `GET /api/services/technicians/:id` → `200` with services + reviews.
- [ ] `GET /api/services/technicians/:id` with non-existent UUID → `404`.
- [ ] `GET /api/services/technicians/:id` with invalid UUID → `400`.

### 11. Technician (Self-Service)

- [ ] `PUT /api/technician/profile` → `200`, profile updated.
- [ ] `PUT /api/technician/profile` with invalid `experience` (non-integer) → `400`.
- [ ] `PUT /api/technician/availability` with valid schedule → `200`.
- [ ] `PUT /api/technician/availability` with malformed object → `400`.
- [ ] `GET /api/technician/bookings` → `200`, only this technician's bookings.
- [ ] Access any `/api/technician/*` route as CUSTOMER → `403`.

### 12. Bookings — Creation & Listing

- [ ] `POST /api/bookings` as CUSTOMER → `201`, status `REQUESTED`, `servicePrice` copied from service.
- [ ] `POST` with non-existent `serviceId` → `404` "Service not found!".
- [ ] `POST` with invalid `scheduledDate` → `400` "Invalid scheduled date".
- [ ] `POST` missing required fields → `400`.
- [ ] `POST` as TECHNICIAN → `403`.
- [ ] `GET /api/bookings` as CUSTOMER → only own bookings.
- [ ] `GET /api/bookings` as TECHNICIAN → only assigned bookings.
- [ ] `GET /api/bookings` as ADMIN → all bookings.
- [ ] `GET /api/bookings?page=1&limit=5` → pagination `meta` correct.
- [ ] `GET /api/bookings/:id` as the booking's customer → `200`.
- [ ] `GET /api/bookings/:id` as the assigned technician → `200`.
- [ ] `GET /api/bookings/:id` as ADMIN → `200`.
- [ ] `GET /api/bookings/:id` as a **different** customer → `403` "You are not authorized to view this booking!".
- [ ] `GET /api/bookings/:id` non-existent → `404`.
- [ ] `GET /api/bookings/:id` invalid UUID → `400`.

### 13. Booking Status Transitions

The valid state machine (see [`bookingStatus.ts`](src/modules/booking/bookingStatus.ts:4)):

```
REQUESTED → ACCEPTED | DECLINED | CANCELLED
ACCEPTED  → PAID | CANCELLED
PAID      → IN_PROGRESS | CANCELLED
IN_PROGRESS → COMPLETED
COMPLETED → (terminal)
DECLINED  → (terminal)
CANCELLED → (terminal)
```

- [ ] Technician sets `REQUESTED → ACCEPTED` via `PATCH /api/technician/bookings/:id` → `200`.
- [ ] Technician sets `REQUESTED → DECLINED` → `200`.
- [ ] Technician sets `REQUESTED → COMPLETED` (invalid) → note: the technician route does **not** call `assertTransition`; verify actual behavior and document it.
- [ ] Customer cancels `REQUESTED → CANCELLED` via `PATCH /api/bookings/:id/cancel` with `{ "reason": "..." }` → `200`, `cancellationReason` stored.
- [ ] Customer cancels `ACCEPTED → CANCELLED` (payment `PENDING`) → `200`, no refund, payment stays `PENDING`.
- [ ] Customer cancels `COMPLETED → CANCELLED` → `400` "Completed bookings cannot be cancelled."
- [ ] Customer cancels `IN_PROGRESS → CANCELLED` → `400` "Booking cannot be cancelled after the service has started."
- [ ] Customer cancels an already-`CANCELLED` booking → `400` "Booking has already been cancelled."
- [ ] Customer cancels with missing `reason` → `400` validation error.
- [ ] Customer cancels a booking they don't own → `403`.
- [ ] Technician updates a booking not assigned to them → `403`.
- [ ] Technician updates with invalid `status` value → `400`.
- [ ] Technician updates with non-existent booking ID → `404`.

### 14. Payment & Refund Flow

- [ ] `POST /api/payments/checkout` on an `ACCEPTED` booking → `200`, returns `url` + `sessionId`.
- [ ] `POST /api/payments/checkout` on a `REQUESTED` booking → `400` "Booking must be accepted before payment!".
- [ ] `POST /api/payments/checkout` as non-owner → `403`.
- [ ] `POST /api/payments/checkout` on non-existent booking → `404`.
- [ ] `POST /api/payments/checkout` on an already-paid booking → `400` "This booking has already been paid!".
- [ ] `GET /api/payments` as CUSTOMER → only own payments.
- [ ] `GET /api/payments` as ADMIN → all payments.
- [ ] `GET /api/payments/:id` as the owning customer → `200`.
- [ ] `GET /api/payments/:id` as a different customer → `403`.
- [ ] `GET /api/payments/:id` as ADMIN → `200`.
- [ ] `GET /api/payments/:id` non-existent → `404`.
- [ ] `GET /api/payments/:id` invalid UUID → `400`.

**Refund flow:**
- [ ] Create a booking → technician accepts → customer checks out → webhook marks booking `PAID` with `COMPLETED` payment.
- [ ] Customer cancels the `PAID` booking via `PATCH /api/bookings/:id/cancel` with `{ "reason": "..." }` → `200`, payment status → `REFUNDED`, booking → `CANCELLED`, `cancellationReason` stored. (Requires valid Stripe keys; otherwise expect a Stripe error.)
- [ ] Cancel a booking with **no** payment → no refund attempted, booking → `CANCELLED`.
- [ ] Cancel a booking with a `PENDING`/`FAILED` payment → no refund (only `COMPLETED` payments trigger refunds).

### 15. Stripe Webhook Behavior

- [ ] `POST /api/payments/webhook` with **no** `stripe-signature` header → `400` "Missing or invalid Stripe signature header".
- [ ] `POST /api/payments/webhook` with an **invalid** signature → `400` "Webhook signature verification failed".
- [ ] Use Stripe CLI to forward a `checkout.session.completed` event (with `payment_status: paid`) → payment marked `COMPLETED`, booking → `PAID`.
- [ ] Forward a `checkout.session.completed` with `payment_status: unpaid` → no state change (handler ignores it).
- [ ] Forward `checkout.session.async_payment_succeeded` → payment marked `COMPLETED`, booking → `PAID`.
- [ ] Forward `checkout.session.async_payment_failed` → payment status → `FAILED`.
- [ ] Forward `charge.refunded` → payment → `REFUNDED`, booking → `CANCELLED`.
- [ ] Verify idempotency: a second `checkout.session.completed` for the same booking does **not** create a duplicate payment or change state (completed-payment check runs inside the transaction).
- [ ] Verify refund idempotency: a second `charge.refunded` for the same payment does **not** change state.
- [ ] Verify the webhook endpoint receives a **raw** body (not parsed JSON) — confirm by sending a raw payload in Postman with `Content-Type: application/json` and body type "raw".

### 16. Reviews

- [ ] `POST /api/reviews` on a `COMPLETED` booking as the customer → `201`, review created.
- [ ] Verify the technician's `averageRating` and `totalReviews` are recalculated after the review.
- [ ] `POST /api/reviews` on a non-completed booking → `400` "You can only leave a review after the job is COMPLETED".
- [ ] `POST /api/reviews` as a non-owner of the booking → `403`.
- [ ] `POST /api/reviews` on non-existent booking → `404`.
- [ ] `POST /api/reviews` with `rating=0` → `400` "Rating must be at least 1".
- [ ] `POST /api/reviews` with `rating=6` → `400` "Rating must be at most 5".
- [ ] `POST /api/reviews` with non-integer `rating` (e.g., `4.5`) → `400` "Rating must be an integer".
- [ ] `POST /api/reviews` with missing `rating` → `400`.
- [ ] `POST /api/reviews` on the **same** booking twice → `409` (unique constraint on `bookingId`).
- [ ] `POST /api/reviews` as TECHNICIAN → `403`.

### 17. Admin Endpoints

- [ ] `GET /api/admin/users` → `200` with pagination `meta`, no `password` fields.
- [ ] `GET /api/admin/users?page=1&limit=5` → pagination works.
- [ ] `PATCH /api/admin/users/:id` with `{ status: "BANNED" }` → `200`.
- [ ] `PATCH` with invalid `status` (e.g., `PENDING`) → `400`.
- [ ] `PATCH` on non-existent user → `404`.
- [ ] `GET /api/admin/bookings` → `200`, all bookings.
- [ ] `GET /api/admin/bookings/:id` → `200` with payment + review included.
- [ ] `GET /api/admin/bookings/:id` non-existent → `404`.
- [ ] `GET /api/admin/payments` → `200`, all payments.
- [ ] `GET /api/admin/payments/:id` → `200`.
- [ ] `GET /api/admin/payments/:id` non-existent → `404`.
- [ ] Access any `/api/admin/*` route as CUSTOMER → `403`.
- [ ] Access any `/api/admin/*` route as TECHNICIAN → `403`.
- [ ] Access any `/api/admin/*` route unauthenticated → `401`.

### 18. Edge Cases & Error Handling

- [ ] Hit a non-existent route (e.g., `GET /api/unknown`) → `404` "Route not found: /api/unknown".
- [ ] Send malformed JSON body → expect a parse error (Express default `400`).
- [ ] Send a non-UUID `:id` to any param-validated route → `400` "Invalid UUID format for id parameter".
- [ ] Verify the error response shape matches `{ success, message, errorSources, stack }`.
- [ ] Verify `stack` is present in `development` and absent in `production` (toggle `NODE_ENV`).
- [ ] Trigger a Prisma unique constraint violation (e.g., duplicate category name) → `409` with `errorSources`.
- [ ] Trigger a Prisma "record not found" on an update → `404`.

### 19. Full End-to-End Flow (Happy Path)

Run this complete scenario to validate the entire system:

1. [ ] Register a CUSTOMER and a TECHNICIAN.
2. [ ] Login as ADMIN → create a category.
3. [ ] Login as TECHNICIAN → update profile + availability → create a service in that category.
4. [ ] Login as CUSTOMER → browse services → view a technician profile.
5. [ ] Customer creates a booking (`REQUESTED`).
6. [ ] Technician views their bookings → accepts the booking (`ACCEPTED`).
7. [ ] Customer creates a Checkout Session (`POST /api/payments/checkout`) → redirects to Stripe → pays → webhook marks booking `PAID`.
8. [ ] Technician sets booking to `IN_PROGRESS` → then `COMPLETED`.
9. [ ] Customer leaves a review → verify technician's `averageRating` updated.
10. [ ] Admin views all users, bookings, and payments.
11. [ ] Repeat booking flow but cancel a `PAID` booking → verify refund (`REFUNDED`).
12. [ ] Admin bans the customer → customer can no longer login or access routes.
13. [ ] Admin unbans → customer access restored.
14. [ ] Customer logs out → cookies cleared → `/api/auth/me` returns `401`.

---

## Endpoint Quick Reference

| # | Method | Endpoint | Auth |
| --- | --- | --- | --- |
| 1 | GET | `/api/health` | None |
| 2 | POST | `/api/auth/register` | None |
| 3 | POST | `/api/auth/login` | None |
| 4 | GET | `/api/auth/me` | CUSTOMER, TECHNICIAN, ADMIN |
| 5 | POST | `/api/auth/logout` | CUSTOMER, TECHNICIAN, ADMIN |
| 6 | POST | `/api/auth/refresh` | None (cookie) |
| 7 | GET | `/api/services` | None |
| 8 | GET | `/api/services/categories` | None |
| 9 | GET | `/api/services/:id` | None |
| 10 | POST | `/api/services` | TECHNICIAN |
| 11 | PATCH | `/api/services/:id` | TECHNICIAN |
| 12 | DELETE | `/api/services/:id` | TECHNICIAN |
| 13 | GET | `/api/services/technicians` | None |
| 14 | GET | `/api/services/technicians/:id` | None |
| 15 | GET | `/api/technician/bookings` | TECHNICIAN |
| 16 | PATCH | `/api/technician/bookings/:id` | TECHNICIAN |
| 17 | PUT | `/api/technician/profile` | TECHNICIAN |
| 18 | PUT | `/api/technician/availability` | TECHNICIAN |
| 19 | POST | `/api/bookings` | CUSTOMER |
| 20 | GET | `/api/bookings` | CUSTOMER, TECHNICIAN, ADMIN |
| 21 | GET | `/api/bookings/:id` | CUSTOMER, TECHNICIAN, ADMIN |
| 22 | PATCH | `/api/bookings/:id/cancel` | CUSTOMER |
| 23 | POST | `/api/payments/webhook` | None (Stripe) |
| 24 | POST | `/api/payments/checkout` | CUSTOMER |
| 25 | GET | `/api/payments` | CUSTOMER, ADMIN |
| 26 | GET | `/api/payments/:id` | CUSTOMER, ADMIN |
| 27 | POST | `/api/reviews` | CUSTOMER |
| 28 | GET | `/api/admin/users` | ADMIN |
| 29 | PATCH | `/api/admin/users/:id` | ADMIN |
| 30 | GET | `/api/admin/bookings` | ADMIN |
| 31 | GET | `/api/admin/bookings/:id` | ADMIN |
| 32 | GET | `/api/admin/payments` | ADMIN |
| 33 | GET | `/api/admin/payments/:id` | ADMIN |
| 34 | GET | `/api/admin/categories` | ADMIN |
| 35 | POST | `/api/admin/categories` | ADMIN |
| 36 | PATCH | `/api/admin/categories/:id` | ADMIN |
| 37 | DELETE | `/api/admin/categories/:id` | ADMIN |

**Total: 37 endpoints**
