# Cognition Backend

Express + TypeScript auth proxy and API server.

## Quick Start

```bash
npm install
npm run dev       # Start dev server at http://localhost:3001
npm test          # Run all tests (15 tests, 2 suites)
npm run build     # Compile TypeScript
```

## Environment Variables

Create a `.env` file:

```env
COGNITO_CLIENT_ID=your-client-id
COGNITO_USER_POOL_ID=us-east-1_xxxxxxx
AWS_REGION=us-east-1
FRONTEND_URL=http://localhost:5173
PORT=3001
```

## API Endpoints

### Auth (proxy to Cognito)

| Endpoint | Description |
|---|---|
| `POST /auth/signin` | Authenticate with email/password, sets refresh HTTP-only cookie |
| `POST /auth/signin/mfa` | Complete MFA challenge |
| `POST /auth/refresh` | Refresh tokens using HTTP-only cookie |
| `POST /auth/signout` | Clear refresh cookie |

### Protected API

| Endpoint | Description |
|---|---|
| `GET /api/me` | Returns decoded JWT claims (requires `Authorization: Bearer <token>`) |

## Tech Stack

- **Express 4** + **TypeScript**
- **AWS SDK v3** (Cognito)
- **jose** (JWT verification via JWKS)
- **cookie-parser** (HTTP-only cookie handling)
- **Jest 29** + **supertest** (testing)
