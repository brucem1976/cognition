# Cognition Frontend

React + TypeScript + Tailwind CSS application built with Vite.

## Quick Start

> **Requires the backend running on port 3001** — see root README for full setup.

```bash
npm install
npm run dev       # Start dev server at http://localhost:5173
npm test          # Run all tests (25 tests, 6 suites)
npm run build     # Production build
```

## Environment Variables

Copy the example and fill in your Cognito values from `terraform output`:

```bash
cp .env.example .env
```

See `.env.example` for the full list of variables.

## Dev Proxy

In development, Vite proxies `/auth` and `/api` requests to the backend:

```
http://localhost:5173/auth/*  →  http://localhost:3001/auth/*
http://localhost:5173/api/*   →  http://localhost:3001/api/*
```

## Project Structure

```
src/
├── auth/
│   ├── CognitoService.ts          # Auth service (Cognito SDK + backend proxy)
│   ├── CognitoService.test.ts     # Service unit tests
│   └── AuthContext.tsx             # React Context with auto-refresh
├── features/auth/
│   ├── SignUp.tsx                  # Registration + email verification
│   ├── SignIn.tsx                  # Login + MFA handling
│   ├── ForgotPassword.tsx         # Password reset flow
│   └── MFAVerification.tsx        # MFA code entry
├── App.tsx                        # Routing
├── main.tsx                       # Entry point (BrowserRouter)
└── setupTests.ts                  # Jest environment setup
```

## Authentication Flows

### Sign Up (direct to Cognito)
1. User enters email, password, phone number
2. Cognito creates the user (unconfirmed)
3. UI switches to verification code input
4. User enters code → account confirmed

### Sign In (via backend proxy)
1. User enters email, password → `POST /auth/signin`
2. Backend authenticates with Cognito, sets refresh token as HTTP-only cookie
3. Access/ID tokens returned in JSON, stored in React state
4. If MFA required → MFA verification step via `POST /auth/signin/mfa`

### Forgot Password (direct to Cognito)
1. User enters email → Cognito sends reset code
2. User enters code + new password → password reset

### Token Refresh (automatic)
`AuthContext` provides `authenticatedFetch()` which auto-retries on 401 by calling `POST /auth/refresh`.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 7** (dev server + build + proxy)
- **Tailwind CSS 4** (styling)
- **AWS SDK v3** (`@aws-sdk/client-cognito-identity-provider`)
- **Jest 29** + **React Testing Library** (testing)
- **React Router 7** (routing)
