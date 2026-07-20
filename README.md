# FixItNow Backend

A production-ready REST API for a home-service marketplace platform (FixItNow) where customers can browse services, book technicians, pay online via Stripe, and leave reviews. Built with **Express 5**, **TypeScript**, **Prisma ORM**, **PostgreSQL**, and **Zod** validation.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database & Migrations](#database--migrations)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)
- [Authentication & Authorization](#authentication--authorization)
- [Booking Status State Machine](#booking-status-state-machine)
- [Payments & Stripe Webhooks](#payments--stripe-webhooks)
- [Error Handling](#error-handling)
- [License](#license)

---

## Features

- **JWT Authentication** with access + refresh token rotation and httpOnly cookies
- **Role-based access control** (CUSTOMER, TECHNICIAN, ADMIN)
- **Service CRUD** for technicians with category & price filtering
- **Booking system** with a declarative status-transition state machine
- **Stripe payments** — Hosted Checkout Sessions, webhook handling (success/failure/refund), and automatic refunds
- **Automatic refunds** when a customer cancels a paid booking before it starts
- **Reviews & ratings** with automatic technician average-rating recalculation
- **Admin dashboard** — manage users, bookings, payments, and categories
- **Pagination** across services, users, and bookings
- **Centralized error handling** with a global error handler (Zod, Prisma, and custom errors)
- **Banned-user revocation** checked against the database on every authenticated request
- **Security** — Helmet headers, CORS, httpOnly cookies

---

## Tech Stack

| Layer            | Technology                                   |
| ---------------- | -------------------------------------------- |
| Runtime          | Node.js + TypeScript (ESM)                   |
| Framework        | Express 5                                    |
| Database         | PostgreSQL (Neon) via Prisma ORM v7          |
| Validation       | Zod v4                                       |
| Authentication   | JSON Web Tokens (jsonwebtoken) + bcryptjs    |
| Payments         | Stripe SDK                                   |
| Security         | Helmet, CORS, cookie-parser                  |
| Dev Tooling      | tsx, esbuild, TypeScript 6                   |

---

## Project Structure

```
FixItNow-Backend/
├── prisma/
│   ├── schema/              # Multi-file Prisma schema
│   │   ├── schema.prisma    # Generator + datasource
│   │   ├── enums.prisma     # Role, Status, BookingStatus, PaymentStatus
│   │   ├── user.prisma
│   │   ├── technician.prisma
│   │   ├── service.prisma
│   │   ├── category.prisma
│   │   ├── booking.prisma
│   │   ├── payment.prisma
│   │   └── review.prisma
│   ├── migrations/          # Applied migration history
│   └── seed.ts              # Database seed script
├── src/
│   ├── app.ts               # Express app setup & route registration
│   ├── server.ts            # HTTP server entry point
│   ├── config/              # Environment configuration
│   ├── lib/                 # Prisma client & Stripe instance
│   ├── interfaces/          # Shared TypeScript types & declarations
│   ├── middlewares/         # auth, validateRequest, validateParams, globalErrorHandler
│   ├── utils/               # AppError, sendResponse, catchAsync, pagination
│   ├── validations/         # Shared validation schemas (e.g. UUID param)
│   └── modules/             # Feature modules (route → controller → service → validation)
│       ├── auth/
│       ├── service/
│       ├── booking/
│       ├── payment/
│       ├── technician/
│       ├── review/
│       ├── category/
│       └── admin/
└── package.json
```

Each module follows a consistent layered pattern:

```
module/
├── module.route.ts        # Route definitions + middleware wiring
├── module.controller.ts   # Request handlers (catchAsync + sendResponse)
├── module.service.ts      # Business logic & Prisma queries
└── module.validation.ts   # Zod schemas + inferred payload types
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A PostgreSQL database (e.g. a free [Neon](https://neon.tech) instance)
- A [Stripe](https://stripe.com) account (for payments)

### Installation

```bash
# 1. Clone the repository
git https://github.com/mahmudulkarim420/FixItNow-Backend.git
cd FixItNow-Backend

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
#   then fill in the values (see Environment Variables below)

# 4. Generate the Prisma client
npx prisma generate

# 5. Run migrations
npx prisma migrate deploy
#   (use `npx prisma migrate dev` in development)

# 6. (Optional) Seed the database
npx prisma db seed

# 7. Start the development server
npm run dev
```

The server starts on `http://localhost:5000`.

---

## Environment Variables

Create a `.env` file in the project root. The `.env` file is git-ignored.

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@host:port/dbname?sslmode=require

# JWT
JWT_SECRET=your_access_token_secret
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Frontend (CORS origin + Stripe Checkout redirect URLs)
FRONTEND_URL=http://localhost:3000
CLIENT_URL=http://localhost:3000
```

---

## Database & Migrations

This project uses Prisma's **multi-file schema** feature — the schema is split across files in `prisma/schema/`.

```bash
# Generate the Prisma client (after schema changes)
npx prisma generate

# Create & apply a new migration in development
npx prisma migrate dev --name <migration_name>

# Apply existing migrations in production
npx prisma migrate deploy

# Seed the database
npx prisma db seed

# Open Prisma Studio
npx prisma studio
```

---

## Available Scripts

| Script             | Description                                                        |
| ------------------ | ------------------------------------------------------------------ |
| `npm run dev`      | Start the dev server with hot-reload (`tsx watch`)                 |
| `npm run build`    | Compile TypeScript + bundle with esbuild to `dist/server.js`       |
| `npm start`        | Run the production build (`node dist/server.js`)                   |
| `npm run stripe:webhook` | Forward Stripe CLI webhooks to the local server              |

---

## API Reference

Base URL: `http://localhost:5000/api`

### Auth (`/api/auth`)

| Method | Endpoint   | Access                          | Description                  |
| ------ | ---------- | ------------------------------- | ---------------------------- |
| POST   | `/register`| Public                          | Register a new user          |
| POST   | `/login`   | Public                          | Login & set token cookies    |
| GET    | `/me`      | CUSTOMER, TECHNICIAN, ADMIN     | Get current user profile     |
| POST   | `/logout`  | CUSTOMER, TECHNICIAN, ADMIN     | Clear auth cookies           |
| POST   | `/refresh` | Public (refresh cookie)         | Rotate access token          |

### Services (`/api/services`)

| Method | Endpoint        | Access      | Description                          |
| ------ | --------------- | ----------- | ------------------------------------ |
| GET    | `/`             | Public      | List services (search, filter, paginate) |
| GET    | `/:id`          | Public      | Get a single service                 |
| POST   | `/`             | TECHNICIAN  | Create a service                     |
| PATCH  | `/:id`          | TECHNICIAN  | Update own service                   |
| DELETE | `/:id`          | TECHNICIAN  | Delete own service                   |
| GET    | `/categories`   | Public      | List all categories                  |

### Technicians (`/api/services/technicians`)

| Method | Endpoint | Access | Description                          |
| ------ | -------- | ------ | ------------------------------------ |
| GET    | `/`      | Public | List technicians (filter, paginate)  |
| GET    | `/:id`   | Public | Get a technician's profile & reviews |

### Technician Actions (`/api/technician`)

| Method | Endpoint            | Access     | Description                          |
| ------ | ------------------- | ---------- | ------------------------------------ |
| GET    | `/bookings`         | TECHNICIAN | List the technician's bookings       |
| PATCH  | `/bookings/:id`     | TECHNICIAN | Update a booking's status            |
| PUT    | `/profile`          | TECHNICIAN | Update technician profile            |
| PUT    | `/availability`     | TECHNICIAN | Update availability schedule         |

### Bookings (`/api/bookings`)

| Method | Endpoint       | Access                              | Description                |
| ------ | -------------- | ----------------------------------- | -------------------------- |
| POST   | `/`            | CUSTOMER                            | Create a booking           |
| GET    | `/`            | CUSTOMER, TECHNICIAN, ADMIN         | List bookings (paginated)  |
| GET    | `/:id`         | CUSTOMER, TECHNICIAN, ADMIN         | Get a single booking       |
| PATCH  | `/:id/cancel`  | CUSTOMER                            | Cancel a booking (+refund) |

### Payments (`/api/payments`)

| Method | Endpoint           | Access             | Description                                  |
| ------ | ------------------ | ------------------ | -------------------------------------------- |
| POST   | `/checkout`        | CUSTOMER           | Create a Stripe Checkout Session (returns URL) |
| GET    | `/`                | CUSTOMER, ADMIN    | List payment history                         |
| GET    | `/:id`             | CUSTOMER, ADMIN    | Get a single payment                         |
| POST   | `/webhook`         | Stripe (signature) | Stripe webhook event handler                 |

### Reviews (`/api/reviews`)

| Method | Endpoint | Access   | Description                |
| ------ | -------- | -------- | -------------------------- |
| POST   | `/`      | CUSTOMER | Create a review (+rating)  |

### Categories (`/api/admin/categories`)

| Method | Endpoint | Access | Description              |
| ------ | -------- | ------ | ------------------------ |
| GET    | `/`      | ADMIN  | List all categories      |
| POST   | `/`      | ADMIN  | Create a category        |
| PATCH  | `/:id`   | ADMIN  | Update a category        |
| DELETE | `/:id`   | ADMIN  | Delete a category        |

### Admin (`/api/admin`)

| Method | Endpoint        | Access | Description                  |
| ------ | --------------- | ------ | ---------------------------- |
| GET    | `/users`        | ADMIN  | List users (paginated)       |
| PATCH  | `/users/:id`    | ADMIN  | Ban/unban a user             |
| GET    | `/bookings`     | ADMIN  | List all bookings            |
| GET    | `/bookings/:id` | ADMIN  | Get a single booking         |
| GET    | `/payments`     | ADMIN  | List all payments            |
| GET    | `/payments/:id` | ADMIN  | Get a single payment         |

---

## Authentication & Authorization

- **Access tokens** are signed JWTs stored in an httpOnly cookie (`accessToken`), valid for `JWT_EXPIRES_IN` (default 1d).
- **Refresh tokens** are signed JWTs stored in a separate httpOnly cookie (`refreshToken`), valid for `JWT_REFRESH_EXPIRES_IN` (default 7d).
- The `POST /auth/refresh` endpoint validates the refresh cookie and issues a new access token (token rotation).
- The [`auth`](src/middlewares/auth.ts) middleware verifies the JWT, loads the user from the database, and enforces role-based access. Banned users are rejected in real time.

---

## Booking Status State Machine

Booking status transitions are guarded by a declarative state machine in [`bookingStatus.ts`](src/modules/booking/bookingStatus.ts):

```
REQUESTED ──► ACCEPTED ──► PAID ──► IN_PROGRESS ──► COMPLETED
    │            │           │
    │            └─► CANCELLED ◄┘
    │
    ├──► DECLINED
    └──► CANCELLED
```

- `COMPLETED`, `DECLINED`, and `CANCELLED` are terminal states.
- Cancelling a `PAID` booking automatically issues a **Stripe refund** and sets the payment status to `REFUNDED` within a single Prisma transaction.

---

## Payments & Stripe Webhooks

Payments use **Stripe Hosted Checkout** (no client-side card handling):

1. The customer calls `POST /payments/checkout` with a `bookingId`. The backend creates a Stripe Checkout Session (amount derived from the booking's `servicePrice`) and returns a `url` to redirect to.
2. Stripe hosts the payment page. On `success_url` / `cancel_url` the customer is redirected back to the frontend (`FRONTEND_URL`).
3. The **Stripe webhook** (`POST /payments/webhook`) verifies the signature and, on `checkout.session.completed`, marks the booking as `PAID`, stores the Payment Intent / transaction ID, and is **idempotent** (duplicate events for an already-completed payment are ignored).

Handled webhook events:

- `checkout.session.completed` → payment `COMPLETED`, booking `PAID`
- `checkout.session.async_payment_failed` → payment `FAILED`
- `charge.refunded` → payment `REFUNDED`, booking `CANCELLED`

To test webhooks locally:

```bash
npm run stripe:webhook
```

This forwards Stripe CLI events to `http://localhost:5000/api/payments/webhook`.

---

## Error Handling

All errors flow through a centralized [`globalErrorHandler`](src/middlewares/globalErrorHandler.ts) middleware that produces a consistent JSON response:

```json
{
  "success": false,
  "message": "Human-readable message",
  "errorSources": [{ "path": "field", "message": "detail" }]
}
```

Handled error types:

- **ZodError** — validation errors mapped to field-level `errorSources`
- **Prisma P2002** — unique-constraint violations (e.g. duplicate category name)
- **Prisma P2025** — record not found
- **AppError** — custom operational errors with a status code
- **Generic Error** — fallback 500 handler

Custom errors are thrown via `next(new AppError(statusCode, message))` from controllers/services.

---

## License

ISC
