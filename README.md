# Cognition

A distributed application built with React, TypeScript, AWS Cognito, and Terraform.

## Architecture

```
cognition/
├── frontend/          # React + TypeScript + Tailwind CSS (Vite)
├── terraform/         # AWS infrastructure (Cognito User Pool, Lambda)
├── tests/infra/       # Integration tests for Cognito flows
└── functions/         # Lambda functions (pre-token generation)
```

### Authentication

The app uses **AWS Cognito** for authentication, with the frontend calling the Cognito SDK directly. Key features:

- **Sign Up** with email verification
- **Sign In** with optional MFA (SMS or TOTP)
- **Forgot Password** with code verification
- Pre-token generation Lambda for custom JWT claims

### Token Configuration

| Token | Duration | Notes |
|---|---|---|
| Access Token | 60 minutes | Short-lived, used for API authorization |
| ID Token | 60 minutes | Contains user identity claims |
| Refresh Token | 30 days | Used to obtain new access/id tokens |

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
- A User Pool Client (`cognition-frontend-client`) for direct frontend auth
- A Pre-Token Generation Lambda
- IAM roles for Lambda execution and SMS (MFA)

### 2. Capture outputs

After `terraform apply`, note the outputs:

```bash
terraform output
```

You'll see:
```
cognito_client_id   = "your-client-id"
cognito_user_pool_id = "us-east-1_xxxxxxx"
```

These values are needed for the frontend configuration.

### 3. Run infrastructure tests (optional)

```bash
cd tests/infra
npm install
npm test
```

This runs integration tests against the live Cognito service (sign up, sign in, forgot password flows).

> **Note:** These tests create real users in your Cognito pool and require the `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, and `AWS_REGION` environment variables.

---

## Phase 2: Run the Frontend

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment

Create a `.env` file in the `frontend/` directory with the Terraform outputs:

```env
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxx
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_AWS_REGION=us-east-1
```

### 3. Start the dev server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### 4. Run tests

```bash
npm test
```

This runs all unit tests (22 tests across 6 suites) covering:
- `CognitoService` — SDK interactions
- `SignUp` — registration + email verification flow
- `SignIn` — login + MFA challenge handling
- `MFAVerification` — MFA code submission
- `ForgotPassword` — password reset flow
- `App` — routing

### 5. Available routes

| Route | Component | Description |
|---|---|---|
| `/` | Home | Welcome page |
| `/signin` | SignIn | Login with email/password |
| `/signup` | SignUp | Register new account |
| `/forgot-password` | ForgotPassword | Reset password |

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

## Next Steps

- **Phase 3: Backend** — Express/Fastify API with HTTP-only cookie token storage and automatic token refresh
