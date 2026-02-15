import {
    CognitoIdentityProviderClient,
    SignUpCommand,
    ForgotPasswordCommand,
    ConfirmForgotPasswordCommand,
    ConfirmSignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const CLIENT_ID = process.env.VITE_COGNITO_CLIENT_ID || "test-client-id";
const REGION = process.env.VITE_AWS_REGION || "us-east-1";
const API_BASE = process.env.VITE_API_BASE || '';

export const client = new CognitoIdentityProviderClient({ region: REGION });

export const CognitoService = {
    // ---- Direct Cognito calls (no tokens involved) ----

    signUp: async (email: string, password: string, phoneNumber: string) => {
        const command = new SignUpCommand({
            ClientId: CLIENT_ID,
            Username: email,
            Password: password,
            UserAttributes: [
                { Name: "email", Value: email },
                { Name: "phone_number", Value: phoneNumber }
            ]
        });
        return await client.send(command);
    },

    confirmSignUp: async (email: string, code: string) => {
        const command = new ConfirmSignUpCommand({
            ClientId: CLIENT_ID,
            Username: email,
            ConfirmationCode: code
        });
        return await client.send(command);
    },

    forgotPassword: async (email: string) => {
        const command = new ForgotPasswordCommand({
            ClientId: CLIENT_ID,
            Username: email
        });
        return await client.send(command);
    },

    confirmForgotPassword: async (email: string, code: string, newPassword: string) => {
        const command = new ConfirmForgotPasswordCommand({
            ClientId: CLIENT_ID,
            Username: email,
            ConfirmationCode: code,
            Password: newPassword
        });
        return await client.send(command);
    },

    // ---- Backend proxy calls (tokens handled server-side) ----

    signIn: async (email: string, password: string) => {
        const response = await fetch(`${API_BASE}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Sign in failed');
        }

        return data;
    },

    respondToAuthChallenge: async (challengeName: string, code: string, session: string, username: string) => {
        const response = await fetch(`${API_BASE}/auth/signin/mfa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ challengeName, code, session, username }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'MFA verification failed');
        }

        return data;
    },

    refreshToken: async () => {
        const response = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Token refresh failed');
        }

        return data;
    },

    signOut: async () => {
        const response = await fetch(`${API_BASE}/auth/signout`, {
            method: 'POST',
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Sign out failed');
        }

        return data;
    },
};
