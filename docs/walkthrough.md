# Walkthrough — Cognition

Summary of what was built, tested, and verified across all three phases.

---

## Phase 1: Infrastructure

### What was built
- Terraform config (`terraform/main.tf`) deploying 9 AWS resources: Cognito User Pool, Client, Pre-Token Gen Lambda, IAM roles, Lambda permission
- Integration test suite (`tests/infra/cognito.test.ts`) verifying live Cognito flows

### What was tested
- `terraform apply` — all resources created successfully
- Integration tests: sign up, sign in, forgot password flows against live Cognito pool
- Verified token durations: access 60 min, id 60 min, refresh 30 days

---

## Phase 2: Frontend

### What was built
- React 19 + TypeScript + Vite 7 + Tailwind CSS 4 app
- `CognitoService.ts` — AWS SDK wrapper for all auth operations
- 4 auth components: SignUp, SignIn, MFAVerification, ForgotPassword
- React Router routing for all auth pages

### What was tested
- **22 tests across 6 suites**, all passing:
  - `CognitoService` — SDK interactions (signUp, forgotPassword, confirmForgotPassword)
  - `SignUp` — registration + email verification flow
  - `SignIn` — login + MFA challenge detection
  - `MFAVerification` — code submission
  - `ForgotPassword` — password reset flow
  - `App` — routing

---

## Phase 3: Backend Auth Proxy

### What was built

**Backend (`backend/`):**
- Express + TypeScript auth proxy service
- `POST /auth/signin` — proxies to Cognito, sets refresh token as HTTP-only cookie
- `POST /auth/signin/mfa` — handles MFA challenge completion
- `POST /auth/refresh` — reads cookie, returns new access/id tokens
- `POST /auth/signout` — clears the HTTP-only cookie
- `GET /api/me` — protected endpoint with JWT verification via Cognito JWKS

**Frontend updates:**
- `CognitoService.ts` — signIn/MFA/refresh/signOut refactored to use backend proxy
- `AuthContext.tsx` — React Context with `useAuth()` hook and auto-refresh on 401
- `vite.config.ts` — dev proxy forwarding `/auth` and `/api` to backend
- Components updated for flat backend response format

**Infrastructure:**
- Recreated missing `.tf` files from Terraform state
- Added `terraform/ses.tf` for future SES email integration

### What was tested

**Backend: 15 tests, 2 suites** ✅
- Auth routes: signin (success, MFA, invalid creds, missing fields), refresh (with/without cookie, expired), signout
- JWT middleware: missing header, non-Bearer, invalid token, wrong token_use, valid token

**Frontend: 25 tests, 6 suites** ✅
- CognitoService: direct SDK calls (signUp, forgotPassword) + fetch-based proxy calls (signIn, refresh, signOut)
- SignIn, SignUp, MFAVerification, ForgotPassword components
- App routing

### Manual verification
- Signed in via frontend → verified refresh token set as HTTP-only cookie in DevTools
- Confirmed `document.cookie` does not expose the refresh token
- Tested `/auth/refresh` with cookie → received new tokens
- Tested `/api/me` with access token → received decoded claims
- Tested `/auth/signout` → cookie cleared

---

## Security Model

| Token | Storage | Accessible to JS | Lifetime |
|---|---|---|---|
| Access Token | React state | Yes (needed for API calls) | 60 minutes |
| ID Token | React state | Yes | 60 minutes |
| Refresh Token | HTTP-only cookie | No (XSS immune) | 30 days |
