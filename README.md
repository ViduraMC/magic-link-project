# Magic Link Project — Passwordless Authentication

A modern, secure **passwordless authentication system** built with Next.js. Users sign in by clicking a secure link sent to their email — no passwords required. If the email doesn't exist, the account is automatically created (auto-registration).

## Architecture Overview

```mermaid
flowchart TD
    A["User enters email on /login"] --> B["POST /api/auth/magic-link/send"]
    B --> C["Generate token, hash it, store in DB"]
    C --> D["Email plain token as clickable link"]
    D --> E["User clicks link in email"]
    E --> F["/magic-login?token=xxx"]
    F --> G["POST /api/auth/magic-link/verify"]
    G --> H{"User exists?"}
    H -- Yes --> I["Log them in"]
    H -- No --> J["Create account + Log them in"]
    I --> K["Issue JWT + Session + Cookie"]
    J --> K
    K --> L["/dashboard"]
```

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Neon PostgreSQL (Serverless)
- **ORM:** Prisma 7 with PrismaPg adapter
- **Email:** Nodemailer + Gmail SMTP
- **Auth:** JWT (Access Token) + HttpOnly Cookie (Refresh Token)
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript

## Project Structure

```
magic-link-project/
├── prisma/
│   ├── schema.prisma              # Database models (User, Session, MagicLinkToken)
│   └── migrations/                # Database migration history
├── src/
│   ├── app/
│   │   ├── api/auth/
│   │   │   ├── magic-link/
│   │   │   │   ├── send/route.ts      # POST - Send magic link email
│   │   │   │   └── verify/route.ts    # POST - Verify token & login
│   │   │   ├── me/route.ts            # GET  - Get current user
│   │   │   ├── logout/route.ts        # POST - Logout current session
│   │   │   ├── refresh/route.ts       # POST - Refresh access token
│   │   │   └── sessions/route.ts      # GET  - List active sessions
│   │   ├── login/page.tsx             # Email input form
│   │   ├── magic-login/page.tsx       # Token verification page
│   │   ├── dashboard/page.tsx         # Protected dashboard
│   │   └── page.tsx                   # Root redirect
│   ├── lib/
│   │   ├── prisma.ts                  # Prisma client singleton
│   │   ├── jwt.ts                     # JWT generation & verification
│   │   ├── tokens.ts                  # Token generation & SHA-256 hashing
│   │   ├── cookies.ts                 # HttpOnly cookie helpers
│   │   ├── email.ts                   # Magic link email sender
│   │   ├── auth.ts                    # getCurrentUser helper
│   │   └── validations.ts            # Email format validation
│   ├── types/
│   │   └── index.ts                   # TypeScript interfaces
│   └── generated/
│       └── prisma/                    # Auto-generated Prisma client
├── .env                               # Environment variables
├── prisma.config.ts                   # Prisma configuration
├── package.json
└── tsconfig.json
```

## API Endpoints

### `POST /api/auth/magic-link/send`

Send a magic link to the user's email.

| Field | Value |
|-------|-------|
| Body  | `{ "email": "user@example.com" }` |
| Rate Limit | 1 request per email per 60 seconds |
| Token Expiry | 15 minutes |

### `POST /api/auth/magic-link/verify`

Verify the magic link token and log the user in.

| Field | Value |
|-------|-------|
| Body  | `{ "token": "plain_token_from_email" }` |
| Returns | `{ accessToken: "jwt..." }` + sets HttpOnly refresh cookie |
| Auto-Register | Creates account if email doesn't exist |
| Session Limit | Max 2 sessions per user (oldest removed) |

### `GET /api/auth/me`

Get the currently authenticated user's profile.

| Field | Value |
|-------|-------|
| Header | `Authorization: Bearer <accessToken>` |
| Requires | Valid access token + valid refresh cookie + matching session in DB |

### `POST /api/auth/logout`

Log out the current session.

| Field | Value |
|-------|-------|
| Auth | Uses refresh token cookie (works even with expired access token) |
| Scope | Deletes only the current session, not other devices |

### `POST /api/auth/refresh`

Get a new access token when the current one expires.

| Field | Value |
|-------|-------|
| Auth | Uses refresh token cookie |
| Rotation | Old refresh token is invalidated, new one is issued |
| Session Renewal | Session expiry extended by 14 days |

### `GET /api/auth/sessions`

List all active sessions for the current user.

| Field | Value |
|-------|-------|
| Header | `Authorization: Bearer <accessToken>` |
| Returns | Array of sessions (id, IP, userAgent, timestamps) |

## Two-Token System

| | Access Token | Refresh Token |
|---|---|---|
| **Stored in** | localStorage | HttpOnly cookie |
| **Sent via** | `Authorization: Bearer` header | Automatically by browser |
| **Lifespan** | 15 minutes | 14 days |
| **Purpose** | Authenticates each API request | Gets new access tokens silently |
| **If expired** | Frontend calls `/refresh` | User must request new magic link |

## Security Measures

| Threat | Protection |
|--------|------------|
| Token theft from DB breach | All tokens stored as SHA-256 hashes |
| Magic link reuse | Token deleted from DB immediately after use |
| Expired magic link | 15-minute expiration enforced server-side |
| Email spam / flooding | Rate limit: 1 magic link per email per 60 seconds |
| XSS stealing refresh token | HttpOnly cookie (JavaScript can't access it) |
| CSRF attacks | SameSite: lax cookie policy |
| Email leak in URL | Email removed from magic link URL; looked up from DB |
| Token in browser history | `window.history.replaceState` clears URL after use |
| Session hijacking | JWT userId cross-validated against session's userId |
| Stolen refresh token reuse | Refresh token rotation: old token invalidated on every refresh |
| Unlimited sessions | 2-session limit per user; oldest auto-removed |
| Expired session access | Session expiry checked server-side on every request |

## Getting Started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database
- A Gmail account with [App Password](https://myaccount.google.com/apppasswords)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ViduraMC/magic-link-project.git
   cd magic-link-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables** — Create a `.env` file:
   ```env
   DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"
   JWT_ACCESS_SECRET="your-random-secret-1"
   JWT_REFRESH_SECRET="your-random-secret-2"
   EMAIL_USER="your-email@gmail.com"
   EMAIL_APP_PASSWORD="your-gmail-app-password"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Run database migration**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) — enter your email and check your inbox!
