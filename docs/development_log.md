# Development Log — Cognition

A chronological record of all design decisions, iterations, and problem-solving that occurred during the build of this application. This log captures the full process from initial planning through to a working distributed auth system.

**Date:** 2026-02-15
**Session duration:** ~2 hours

---

## Phase 1: Infrastructure (Cognito via Terraform)

### Planning
- Decided on **AWS Cognito** for authentication with Terraform for infrastructure-as-code.
- Architecture: Cognito User Pool with email as username, optional MFA (SMS + TOTP), and a pre-token generation Lambda for custom JWT claims.

### Implementation
1. Created Terraform config (`terraform/main.tf`) defining:
   - Cognito User Pool (`cognition-user-pool`)
   - User Pool Client (`cognition-frontend-client`) with `USER_PASSWORD_AUTH`, `USER_SRP_AUTH`, `REFRESH_TOKEN_AUTH`, `ADMIN_USER_PASSWORD_AUTH` flows
   - Pre-Token Generation Lambda (`cognito_pre_token_gen`) on Node.js 20.x
   - IAM roles for Lambda execution and SMS via SNS
2. Created integration tests (`tests/infra/cognito.test.ts`) using Jest + AWS SDK to verify live Cognito flows.
3. User applied Terraform — infrastructure deployed successfully.

### Token configuration decided:
- Access Token: 60 minutes
- ID Token: 60 minutes
- Refresh Token: 30 days

---

## Phase 2: Frontend (React)

### Planning
- Decided on **React 19 + TypeScript + Vite 7 + Tailwind CSS 4** stack.
- TDD approach: write tests alongside components.

### Implementation
1. Scaffolded Vite project, installed dependencies.
2. Created `CognitoService.ts` — wrapper around AWS SDK with `signUp`, `signIn` (with MFA), `forgotPassword`, `confirmForgotPassword`, `confirmSignUp`, `respondToAuthChallenge`.
3. Built auth components:
   - `SignUp.tsx` — email, password, phone, verification code flow
   - `SignIn.tsx` — login with MFA challenge detection
   - `MFAVerification.tsx` — code entry for SMS/TOTP
   - `ForgotPassword.tsx` — email → code → new password flow
4. Set up React Router for `/`, `/signin`, `/signup`, `/forgot-password`.

### Test environment challenges
This was the most time-consuming part of Phase 2. Multiple iterations were needed to get Jest working with the Vite + React 19 + TypeScript stack:

1. **ESM vs CommonJS conflict** — Vite uses ESM (`import.meta.env`) but Jest traditionally uses CommonJS. Initial approach tried `NODE_OPTIONS=--experimental-vm-modules` with ESM Jest, which was unstable.

2. **`import.meta.env` in tests** — Created a `vite.config.ts` `define` block to map `process.env.VITE_*` variables, allowing the same code to work in both Vite and Jest environments.

3. **`@testing-library` v16 + Jest v30 incompatibility** — Got persistent `TypeError: (0, _allUtils.getConfig) is not a function` errors. Tried:
   - Adding `@testing-library` to `transformIgnorePatterns` — didn't fix it
   - Downgrading `@testing-library/react` to v14 — failed due to React 19 peer dep
   - **Solution:** downgraded Jest to v29 and set `tsconfig.jest.json` to `module: commonjs` with `moduleResolution: node`

4. **Final test config:**
   - Jest 29 + ts-jest (CommonJS mode)
   - Separate `tsconfig.jest.json` targeting ES2019/CommonJS
   - `aws-sdk-client-mock` for mocking Cognito SDK

**Result:** 22 tests across 6 suites, all passing.

### Decision: Defer token security
- Initially planned HTTP-only cookie storage and auto-refresh in Phase 2
- **Deferred to Phase 3** — requires a backend to set HTTP-only cookies (can't be done client-side)
- Temporary: tokens stored in `localStorage` (noted in commit message as TODO)

---

## Phase 3: Backend Auth Proxy

### Planning
- User asked about the purpose of the auth proxy — explained that HTTP-only cookies can only be set by a server, not client-side JavaScript
- User confirmed they wanted the **full auth proxy** (not just JWT middleware)
- **Decided on Express** (not Fastify) for simplicity and ecosystem maturity

### Architecture decision
Split authentication into two categories:
1. **Direct Cognito calls** (no tokens) — signUp, confirmSignUp, forgotPassword, confirmForgotPassword → frontend calls Cognito SDK directly
2. **Proxied calls** (tokens involved) — signIn, MFA, refresh, signOut → frontend calls backend, which talks to Cognito and manages cookies

### Implementation
1. Created Express + TypeScript project (`backend/`) with:
   - `routes/auth.ts` — signin, signin/mfa, refresh (reads cookie), signout (clears cookie)
   - `middleware/verifyJwt.ts` — validates Cognito JWTs via JWKS using `jose` library, caches keys
   - `routes/api.ts` — `GET /api/me` sample protected endpoint
   - Cookie config: `httpOnly: true`, `secure: true` (prod), `sameSite: strict`, `path: /auth`, 30-day maxAge

2. **15 backend tests** passing across 2 suites (auth routes + JWT middleware)

3. Updated frontend:
   - `CognitoService.ts` — signIn/MFA/refresh/signOut now use `fetch()` with `credentials: 'include'` instead of AWS SDK
   - `AuthContext.tsx` — React Context holding auth state, `useAuth()` hook, `authenticatedFetch()` with auto-retry on 401
   - `SignIn.tsx` + `MFAVerification.tsx` — updated for flat backend response format (`accessToken` instead of `AuthenticationResult.AccessToken`)
   - `vite.config.ts` — added dev proxy forwarding `/auth` and `/api` to `localhost:3001`

4. **25 frontend tests** passing across 6 suites (up from 22 — added proxy call tests)

### Bug: `test-client-id` in production
- **Symptom:** Sign in returned Cognito validation error about `test-client-id`
- **Root cause:** `routes/auth.ts` reads `process.env.COGNITO_CLIENT_ID` at module load time, but `dotenv` wasn't installed, and even after installing it, ES module import hoisting caused `dotenv/config` to load after the route module evaluated
- **Fix:** Used `-r dotenv/config` flag in the `npm run dev` script to preload dotenv before any application modules

---

## Infrastructure Recovery

### Missing Terraform files
- Discovered that the original `.tf` source files and Lambda handler source were missing from the repo (only state files existed)
- **Reconstructed** `terraform/main.tf` and `terraform/lambda/index.js` from the Terraform state file, matching all 9 deployed resources

### SES email configuration
- User requested SES Terraform for future use (not to be enabled yet)
- Created `terraform/ses.tf` with:
  - SES domain identity + DKIM verification
  - IAM role allowing Cognito to send via SES
  - Outputs for DNS records to add
  - Detailed activation instructions in comments
  - Commented-out `email_configuration` block in `main.tf` ready to uncomment

---

## Git Workflow

| Branch | Commit | Content |
|---|---|---|
| `feature/frontend-auth` | `1e0027f` | Phase 1 + 2: Terraform infra, frontend auth components, tests, docs |
| `feature/backend-auth-proxy` | `c1c86f7` | Phase 3: Backend proxy, JWT middleware, frontend integration, SES config |
| `main` | — | Both feature branches merged via fast-forward |

---

## Key Technical Decisions

| Decision | Rationale |
|---|---|
| HTTP-only cookies for refresh token | Prevents XSS attacks from stealing long-lived tokens |
| Access tokens in React state (not localStorage) | Short-lived (60 min), acceptable risk vs convenience |
| Split auth: direct SDK + backend proxy | Only token-handling operations need the backend |
| `jose` library for JWT verification | Lightweight, standards-compliant, handles JWKS fetching |
| Jest 29 (not 30) | v30 had incompatibilities with @testing-library in this stack |
| CommonJS for test environment | More stable than experimental ESM Jest mode |
| Vite dev proxy | Avoids CORS complexity in development |
| `dotenv` via `-r` flag | Ensures env vars load before any module code |

---

## Files Created/Modified

### Backend (new)
- `backend/src/app.ts` — Express factory
- `backend/src/index.ts` — Server entry point
- `backend/src/routes/auth.ts` — Auth proxy endpoints
- `backend/src/routes/api.ts` — Protected API routes
- `backend/src/middleware/verifyJwt.ts` — JWT verification middleware
- `backend/tests/auth.test.ts` — Auth route tests (10 tests)
- `backend/tests/verifyJwt.test.ts` — JWT middleware tests (5 tests)

### Frontend (modified)
- `frontend/src/auth/CognitoService.ts` — Refactored for backend proxy
- `frontend/src/auth/AuthContext.tsx` — New React Context
- `frontend/src/features/auth/SignIn.tsx` — Updated for flat response format
- `frontend/src/features/auth/MFAVerification.tsx` — Updated signature + format
- `frontend/vite.config.ts` — Added dev proxy

### Infrastructure
- `terraform/main.tf` — Recreated from state
- `terraform/lambda/index.js` — Recreated handler
- `terraform/ses.tf` — New SES config (inactive)

### Documentation
- `README.md` — Full project guide with architecture diagram
- `frontend/README.md` — Frontend-specific docs
- `backend/README.md` — Backend-specific docs
