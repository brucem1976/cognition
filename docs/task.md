# Distributed Application Task List

- [x] **Phase 1: Infrastructure (Cognito)**
    - [x] Cognito User Pool + Client via Terraform
    - [x] Pre-Token Generation Lambda
    - [x] Integration tests for Cognito flows

- [x] **Phase 2: Frontend (React)**
    - [x] React + TypeScript + Tailwind + Vite project
    - [x] Jest + React Testing Library setup
    - [x] CognitoService (signUp, signIn, MFA, forgotPassword)
    - [x] Auth components (SignUp, SignIn, MFAVerification, ForgotPassword)
    - [x] Routing, README documentation

- [x] **Phase 3: Backend (Node.js/Express)**
    - [x] Initialize Express + TypeScript project with Jest
    - [x] Auth proxy endpoints (POST /auth/signin, /auth/refresh, /auth/signout)
    - [x] HTTP-only cookie for refresh token storage
    - [x] JWT verification middleware (validate Cognito access tokens)
    - [x] Sample protected endpoint (GET /api/me)
    - [x] Frontend integration: migrate signIn/signOut to backend proxy
    - [x] Frontend AuthContext + automatic token refresh
    - [x] Verify all tests pass (backend + frontend)
