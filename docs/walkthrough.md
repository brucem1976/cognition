# Phase 3: Backend Auth Proxy — Walkthrough

## What Was Built

### Backend (`backend/`)

An Express + TypeScript server providing:

| Endpoint | Purpose |
|---|---|
| `POST /auth/signin` | Authenticates via Cognito, returns access/id tokens, sets refresh token as HTTP-only cookie |
| `POST /auth/signin/mfa` | Handles MFA challenge completion |
| `POST /auth/refresh` | Reads refresh token from cookie, returns new access/id tokens |
| `POST /auth/signout` | Clears the HTTP-only cookie |
| `GET /api/me` | Protected endpoint — requires valid Cognito access token |

**Key files:**
- [app.ts](file:///Users/brucemartin/code/cognition/backend/src/app.ts) — Express factory
- [routes/auth.ts](file:///Users/brucemartin/code/cognition/backend/src/routes/auth.ts) — Auth proxy routes
- [middleware/verifyJwt.ts](file:///Users/brucemartin/code/cognition/backend/src/middleware/verifyJwt.ts) — JWT verification via Cognito JWKS
- [routes/api.ts](file:///Users/brucemartin/code/cognition/backend/src/routes/api.ts) — Protected API routes

### Frontend Updates

- [CognitoService.ts](file:///Users/brucemartin/code/cognition/frontend/src/auth/CognitoService.ts) — signIn/MFA/refresh/signOut now route through backend; signUp/forgotPassword remain direct Cognito calls
- [AuthContext.tsx](file:///Users/brucemartin/code/cognition/frontend/src/auth/AuthContext.tsx) — React Context with auto-refresh on 401
- [vite.config.ts](file:///Users/brucemartin/code/cognition/frontend/vite.config.ts) — Dev proxy forwarding `/auth` and `/api` to backend

## Security Model

- **Refresh token** → HTTP-only cookie (never accessible to JavaScript)
- **Access/ID tokens** → Returned in JSON body, held in React state (not localStorage)
- **Auto-refresh** → `authenticatedFetch()` retries once on 401 after refreshing

## Test Results

**Backend: 15 tests, 2 suites** ✅
- Auth routes: signin, MFA, refresh, signout, error cases
- JWT middleware: missing header, invalid token, wrong token type, valid token

**Frontend: 25 tests, 6 suites** ✅
- CognitoService: SDK calls + fetch-based proxy calls
- SignIn, SignUp, MFAVerification, ForgotPassword components
- App routing

## Running Locally

```bash
# Terminal 1: Backend
cd backend && npm run dev    # Port 3001

# Terminal 2: Frontend
cd frontend && npm run dev   # Port 5173 (proxies /auth, /api → 3001)
```
