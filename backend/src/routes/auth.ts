import { Router, Request, Response } from 'express';
import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    RespondToAuthChallengeCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const router = Router();

const CLIENT_ID = process.env.COGNITO_CLIENT_ID || 'test-client-id';
const REGION = process.env.AWS_REGION || 'us-east-1';

const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// POST /auth/signin
router.post('/signin', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const command = new InitiateAuthCommand({
            ClientId: CLIENT_ID,
            AuthFlow: 'USER_PASSWORD_AUTH',
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password,
            },
        });

        const response = await cognitoClient.send(command);

        // MFA challenge
        if (response.ChallengeName) {
            res.json({
                challengeName: response.ChallengeName,
                session: response.Session,
                challengeParameters: response.ChallengeParameters,
            });
            return;
        }

        // Successful auth
        if (response.AuthenticationResult) {
            const { AccessToken, IdToken, RefreshToken } = response.AuthenticationResult;

            if (RefreshToken) {
                res.cookie('refresh_token', RefreshToken, COOKIE_OPTIONS);
            }

            res.json({
                accessToken: AccessToken,
                idToken: IdToken,
            });
            return;
        }

        res.status(500).json({ error: 'Unexpected response from Cognito' });
    } catch (err: any) {
        const status = err.name === 'NotAuthorizedException' ? 401 : 400;
        res.status(status).json({ error: err.message || 'Authentication failed' });
    }
});

// POST /auth/signin/mfa
router.post('/signin/mfa', async (req: Request, res: Response) => {
    try {
        const { challengeName, session, code, username } = req.body;

        if (!challengeName || !session || !code || !username) {
            res.status(400).json({ error: 'challengeName, session, code, and username are required' });
            return;
        }

        const challengeResponses: Record<string, string> = {
            USERNAME: username,
        };

        if (challengeName === 'SMS_MFA') {
            challengeResponses['SMS_MFA_CODE'] = code;
        } else if (challengeName === 'SOFTWARE_TOKEN_MFA') {
            challengeResponses['SOFTWARE_TOKEN_MFA_CODE'] = code;
        }

        const command = new RespondToAuthChallengeCommand({
            ClientId: CLIENT_ID,
            ChallengeName: challengeName,
            ChallengeResponses: challengeResponses,
            Session: session,
        });

        const response = await cognitoClient.send(command);

        if (response.AuthenticationResult) {
            const { AccessToken, IdToken, RefreshToken } = response.AuthenticationResult;

            if (RefreshToken) {
                res.cookie('refresh_token', RefreshToken, COOKIE_OPTIONS);
            }

            res.json({
                accessToken: AccessToken,
                idToken: IdToken,
            });
            return;
        }

        res.status(500).json({ error: 'MFA verification failed' });
    } catch (err: any) {
        res.status(400).json({ error: err.message || 'MFA verification failed' });
    }
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies?.refresh_token;

        if (!refreshToken) {
            res.status(401).json({ error: 'No refresh token' });
            return;
        }

        const command = new InitiateAuthCommand({
            ClientId: CLIENT_ID,
            AuthFlow: 'REFRESH_TOKEN_AUTH',
            AuthParameters: {
                REFRESH_TOKEN: refreshToken,
            },
        });

        const response = await cognitoClient.send(command);

        if (response.AuthenticationResult) {
            res.json({
                accessToken: response.AuthenticationResult.AccessToken,
                idToken: response.AuthenticationResult.IdToken,
            });
            return;
        }

        res.status(500).json({ error: 'Token refresh failed' });
    } catch (err: any) {
        res.status(401).json({ error: err.message || 'Token refresh failed' });
    }
});

// POST /auth/signout
router.post('/signout', (_req: Request, res: Response) => {
    res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        path: '/auth',
    });
    res.json({ message: 'Signed out' });
});

export { router as authRouter, cognitoClient };
