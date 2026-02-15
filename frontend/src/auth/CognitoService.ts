import {
    CognitoIdentityProviderClient,
    SignUpCommand,
    InitiateAuthCommand,
    ForgotPasswordCommand,
    ConfirmForgotPasswordCommand,
    GlobalSignOutCommand,
    RespondToAuthChallengeCommand,
    ConfirmSignUpCommand
} from "@aws-sdk/client-cognito-identity-provider";

const CLIENT_ID = process.env.VITE_COGNITO_CLIENT_ID || "test-client-id";
const REGION = process.env.VITE_AWS_REGION || "us-east-1";

export const client = new CognitoIdentityProviderClient({ region: REGION });

export const CognitoService = {
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

    signIn: async (email: string, password: string) => {
        const command = new InitiateAuthCommand({
            ClientId: CLIENT_ID,
            AuthFlow: "USER_PASSWORD_AUTH",
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password
            }
        });

        const response = await client.send(command);

        if (response.AuthenticationResult) {
            // Basic storage
            if (response.AuthenticationResult.AccessToken) {
                localStorage.setItem('access_token', response.AuthenticationResult.AccessToken);
            }
            if (response.AuthenticationResult.IdToken) {
                localStorage.setItem('id_token', response.AuthenticationResult.IdToken);
            }
            if (response.AuthenticationResult.RefreshToken) {
                localStorage.setItem('refresh_token', response.AuthenticationResult.RefreshToken);
            }
        }

        return response;
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

    confirmSignUp: async (email: string, code: string) => {
        const command = new ConfirmSignUpCommand({
            ClientId: CLIENT_ID,
            Username: email,
            ConfirmationCode: code
        });
        return await client.send(command);
    },

    respondToAuthChallenge: async (challengeName: string, challengeResponses: Record<string, string>, session: string) => {
        const command = new RespondToAuthChallengeCommand({
            ClientId: CLIENT_ID,
            ChallengeName: challengeName as any, // enum casting
            ChallengeResponses: challengeResponses,
            Session: session
        });
        return await client.send(command);
    }
}
