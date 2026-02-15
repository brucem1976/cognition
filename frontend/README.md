# Cognition Frontend

React + TypeScript + Tailwind CSS application built with Vite.

## Quick Start

```bash
npm install
npm run dev       # Start dev server at http://localhost:5173
npm test          # Run all tests
npm run build     # Production build
```

## Environment Variables

Create a `.env` file with your Cognito configuration (from `terraform output`):

```env
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxx
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_AWS_REGION=us-east-1
```

## Project Structure

```
src/
├── auth/
│   ├── CognitoService.ts          # AWS Cognito SDK wrapper
│   └── CognitoService.test.ts     # Service unit tests
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

### Sign Up
1. User enters email, password, phone number
2. Cognito creates the user (unconfirmed)
3. UI switches to verification code input
4. User enters code → account confirmed

### Sign In
1. User enters email, password
2. If MFA is required → MFA verification step
3. On success → tokens stored, user authenticated

### Forgot Password
1. User enters email → Cognito sends reset code
2. User enters code + new password → password reset

## Testing

Tests use **Jest** + **React Testing Library** with `aws-sdk-client-mock` for mocking Cognito:

```bash
npm test                              # Run all tests
npm test -- src/auth/                 # Run service tests only
npm test -- src/features/auth/        # Run component tests only
```

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 7** (dev server + build)
- **Tailwind CSS 4** (styling)
- **AWS SDK v3** (`@aws-sdk/client-cognito-identity-provider`)
- **Jest 29** + **React Testing Library** (testing)
- **React Router 7** (routing)
