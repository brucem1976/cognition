# Cognition

A distributed application built with React, TypeScript, AWS Cognito, and Terraform.

## Architecture

```
cognition/
├── frontend/          # React + TypeScript + Tailwind CSS (Vite)
├── backend/           # Express + TypeScript auth proxy & API
├── terraform/         # AWS infrastructure (Cognito, Lambda, SES)
└── tests/infra/       # Integration tests for Cognito flows
```

### Authentication Flow

```
┌──────────┐       ┌──────────┐       ┌──────────┐
│ Frontend │──────►│ Backend  │──────►│ Cognito  │
│ (Vite)   │◄──────│ (Express)│◄──────│ (AWS)    │
└──────────┘       └──────────┘       └──────────┘
  :5173              :3001
```

- **Sign Up, Forgot Password** → Frontend calls Cognito SDK directly (no tokens involved)
- **Sign In, MFA, Refresh, Sign Out** → Frontend calls Backend, which proxies to Cognito
- **Refresh token** → Stored in HTTP-only cookie (immune to XSS)
- **Access/ID tokens** → Returned in JSON body, held in React state
- **Protected API calls** → Backend verifies JWTs via Cognito JWKS

### Token Configuration

| Token | Duration | Storage |
|---|---|---|
| Access Token | 60 minutes | React state (in-memory) |
| ID Token | 60 minutes | React state (in-memory) |
| Refresh Token | 30 days | HTTP-only cookie (server-managed) |

---

## Prerequisites

- **Node.js** ≥ 18
- **Terraform** ≥ 1.0
- **AWS CLI** configured with appropriate credentials
- An AWS account with permissions for Cognito, Lambda, IAM, and SNS

---

## Phase 1: Deploy Infrastructure (Terraform)

### 1. Initialize and apply

```bash
cd terraform
terraform init
terraform apply
```

This creates:
- A Cognito User Pool (`cognition-user-pool`) with email as username
- A User Pool Client (`cognition-frontend-client`)
- A Pre-Token Generation Lambda
- IAM roles for Lambda execution and SMS (MFA)

### 2. Capture outputs

```bash
terraform output
```

```
cognito_client_id    = "your-client-id"
cognito_user_pool_id = "us-east-1_xxxxxxx"
```

These values are needed for both the frontend and backend configuration.

### 3. Run infrastructure tests (optional)

```bash
cd tests/infra
npm install
npm test
```

> **Note:** These tests create real users in your Cognito pool.

---

## Phase 2 & 3: Run the Application Locally

### 1. Configure environment

Copy the example env files and fill in your Cognito values from `terraform output`:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

> **Note:** Both services use the same Cognito client ID and pool ID. See each `.env.example` for the full list of variables.

### 2. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Start both services

Run each in a separate terminal:

```bash
# Terminal 1: Backend (port 3001)
cd backend
npm run dev

# Terminal 2: Frontend (port 5173)
cd frontend
npm run dev
```

The frontend Vite dev server automatically proxies `/auth/*` and `/api/*` requests to the backend on port 3001.

Open `http://localhost:5173` in your browser.

### 4. Run tests

```bash
# Backend tests (15 tests)
cd backend && npm test

# Frontend tests (25 tests)
cd frontend && npm test
```

### 5. Available routes

| Route | Component | Description |
|---|---|---|
| `/` | Home | Welcome page |
| `/signin` | SignIn | Login with email/password |
| `/signup` | SignUp | Register new account |
| `/forgot-password` | ForgotPassword | Reset password |

### 6. API endpoints

| Endpoint | Auth | Description |
|---|---|---|
| `POST /auth/signin` | None | Sign in, returns tokens, sets refresh cookie |
| `POST /auth/signin/mfa` | None | Complete MFA challenge |
| `POST /auth/refresh` | Cookie | Refresh access token using HTTP-only cookie |
| `POST /auth/signout` | None | Clears refresh cookie |
| `GET /api/me` | Bearer | Returns decoded JWT claims (sample protected route) |

---

## Cognito User Pool Settings

| Setting | Value |
|---|---|
| Username attribute | `email` |
| Auto-verified attributes | `email` |
| MFA | Optional (SMS + TOTP) |
| Password policy | Min 8 chars, uppercase, lowercase, numbers, symbols |
| Auth flows | `USER_PASSWORD_AUTH`, `USER_SRP_AUTH`, `REFRESH_TOKEN_AUTH`, `ADMIN_USER_PASSWORD_AUTH` |
| Token revocation | Enabled |

---

## SES Email Configuration (Not Yet Enabled)

The Cognito pool currently uses the default email service (50 emails/day limit). SES configuration is prepared in `terraform/ses.tf` — see the activation instructions in that file.
