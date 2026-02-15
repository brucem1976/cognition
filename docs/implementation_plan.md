# Implementation Plan — Cognition

## Overview

Build a distributed authentication system using AWS Cognito, a React frontend, and an Express backend with secure token management.

---

## Phase 1: Infrastructure (Cognito via Terraform)

### Cognito User Pool

- **User Pool** (`cognition-user-pool`) with email as username
- Auto-verified attributes: `email`
- MFA: Optional (SMS + TOTP)
- Password policy: min 8 chars, uppercase, lowercase, numbers, symbols
- Account recovery via verified email (priority 1) and phone (priority 2)

### User Pool Client

- **Client** (`cognition-frontend-client`) with no secret (public SPA client)
- Auth flows: `USER_PASSWORD_AUTH`, `USER_SRP_AUTH`, `REFRESH_TOKEN_AUTH`, `ADMIN_USER_PASSWORD_AUTH`
- Token validity: access 60 min, id 60 min, refresh 30 days
- Token revocation enabled

### Pre-Token Generation Lambda

- Node.js 20.x Lambda (`cognito_pre_token_gen`) for custom JWT claims
- IAM execution role with `AWSLambdaBasicExecutionRole`
- Cognito permission to invoke

### IAM for MFA (SMS)

- IAM role (`cognito_sms_role`) for Cognito → SNS publish
- External ID: `cognition-external-id`

### Integration Tests

- Jest tests against live Cognito: sign up, sign in, forgot password flows
- Located in `tests/infra/cognito.test.ts`

---

## Phase 2: Frontend (React)

### Tech Stack

React 19, TypeScript, Vite 7, Tailwind CSS 4, React Router 7, Jest 29, React Testing Library

### CognitoService

Wrapper around AWS SDK v3 providing: `signUp`, `confirmSignUp`, `signIn`, `respondToAuthChallenge`, `forgotPassword`, `confirmForgotPassword`

### Auth Components

| Component | Route | Flow |
|---|---|---|
| `SignUp` | `/signup` | Email + password + phone → verification code → confirmed |
| `SignIn` | `/signin` | Email + password → (optional MFA) → authenticated |
| `MFAVerification` | — | SMS/TOTP code entry, embedded in SignIn |
| `ForgotPassword` | `/forgot-password` | Email → code → new password |

### Test Environment

- Jest 29 with `ts-jest` in CommonJS mode
- Separate `tsconfig.jest.json` (module: commonjs, target: ES2019)
- `aws-sdk-client-mock` for mocking Cognito SDK
- `vite.config.ts` `define` block mapping `process.env.VITE_*` for dual Vite/Jest compatibility

---

## Phase 3: Backend Auth Proxy + HTTP-Only Cookie Security

### Architecture

```
Frontend (Vite :5173)  →  Backend (Express :3001)  →  Cognito (AWS)
```

**Split approach:**
- Direct Cognito calls (no tokens): signUp, confirmSignUp, forgotPassword, confirmForgotPassword
- Backend proxy calls (tokens): signIn, MFA, refresh, signOut

### Auth Proxy Endpoints

| Endpoint | Description |
|---|---|
| `POST /auth/signin` | Authenticates via Cognito, returns access/id tokens in body, sets refresh token as HTTP-only cookie |
| `POST /auth/signin/mfa` | Completes MFA challenge, same token/cookie handling |
| `POST /auth/refresh` | Reads refresh cookie, calls Cognito REFRESH_TOKEN_AUTH, returns new tokens |
| `POST /auth/signout` | Clears the HTTP-only cookie |

Cookie config: `httpOnly: true`, `secure: true` (prod), `sameSite: strict`, `path: /auth`, 30-day maxAge

### JWT Verification Middleware

- Fetches Cognito JWKS from well-known endpoint
- Caches keys in memory via `jose.createRemoteJWKSet()`
- Verifies `Authorization: Bearer <token>` header
- Validates `token_use === 'access'`
- Attaches decoded claims to `req.user`

### Protected API

`GET /api/me` — Returns decoded JWT claims (sample protected route)

### Frontend Integration

- `AuthContext.tsx` — React Context with `useAuth()` hook
- `authenticatedFetch()` — Auto-retries on 401 after refreshing
- Vite dev proxy: `/auth` and `/api` → `localhost:3001`

---

## SES Email Configuration (Prepared, Not Enabled)

- `terraform/ses.tf` — SES domain identity, DKIM, IAM role for Cognito → SES
- Activation instructions in file comments
- Removes 50 emails/day Cognito default limit
