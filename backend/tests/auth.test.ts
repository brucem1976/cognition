import request from 'supertest';
import { createApp } from '../src/app';
import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    RespondToAuthChallengeCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { mockClient } from 'aws-sdk-client-mock';

const cognitoMock = mockClient(CognitoIdentityProviderClient);

const app = createApp();

describe('Auth Routes', () => {
    beforeEach(() => {
        cognitoMock.reset();
    });

    describe('POST /auth/signin', () => {
        it('returns tokens and sets refresh cookie on successful signin', async () => {
            cognitoMock.on(InitiateAuthCommand).resolves({
                AuthenticationResult: {
                    AccessToken: 'access-token-123',
                    IdToken: 'id-token-123',
                    RefreshToken: 'refresh-token-123',
                },
            });

            const response = await request(app)
                .post('/auth/signin')
                .send({ email: 'test@example.com', password: 'Password123!' });

            expect(response.status).toBe(200);
            expect(response.body.accessToken).toBe('access-token-123');
            expect(response.body.idToken).toBe('id-token-123');
            // Refresh token should NOT be in the body
            expect(response.body.refreshToken).toBeUndefined();
            // Should be in a cookie instead
            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
            const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
            expect(cookieStr).toContain('refresh_token=refresh-token-123');
            expect(cookieStr).toContain('HttpOnly');
            expect(cookieStr).toContain('Path=/auth');
        });

        it('returns 400 if email or password missing', async () => {
            const response = await request(app)
                .post('/auth/signin')
                .send({ email: 'test@example.com' });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Email and password are required');
        });

        it('returns challenge when MFA is required', async () => {
            cognitoMock.on(InitiateAuthCommand).resolves({
                ChallengeName: 'SMS_MFA',
                Session: 'session-token-abc',
                ChallengeParameters: { USER_ID_FOR_SRP: 'test@example.com' },
            });

            const response = await request(app)
                .post('/auth/signin')
                .send({ email: 'test@example.com', password: 'Password123!' });

            expect(response.status).toBe(200);
            expect(response.body.challengeName).toBe('SMS_MFA');
            expect(response.body.session).toBe('session-token-abc');
        });

        it('returns 401 for invalid credentials', async () => {
            const error = new Error('Incorrect username or password.');
            error.name = 'NotAuthorizedException';
            cognitoMock.on(InitiateAuthCommand).rejects(error);

            const response = await request(app)
                .post('/auth/signin')
                .send({ email: 'test@example.com', password: 'WrongPassword' });

            expect(response.status).toBe(401);
            expect(response.body.error).toContain('Incorrect username or password');
        });
    });

    describe('POST /auth/signin/mfa', () => {
        it('returns tokens after successful MFA', async () => {
            cognitoMock.on(RespondToAuthChallengeCommand).resolves({
                AuthenticationResult: {
                    AccessToken: 'mfa-access-token',
                    IdToken: 'mfa-id-token',
                    RefreshToken: 'mfa-refresh-token',
                },
            });

            const response = await request(app)
                .post('/auth/signin/mfa')
                .send({
                    challengeName: 'SMS_MFA',
                    session: 'session-abc',
                    code: '123456',
                    username: 'test@example.com',
                });

            expect(response.status).toBe(200);
            expect(response.body.accessToken).toBe('mfa-access-token');
            expect(response.body.idToken).toBe('mfa-id-token');
            const cookies = response.headers['set-cookie'];
            const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
            expect(cookieStr).toContain('refresh_token=mfa-refresh-token');
        });

        it('returns 400 if required fields are missing', async () => {
            const response = await request(app)
                .post('/auth/signin/mfa')
                .send({ challengeName: 'SMS_MFA' });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /auth/refresh', () => {
        it('returns new tokens when refresh cookie is present', async () => {
            cognitoMock.on(InitiateAuthCommand).resolves({
                AuthenticationResult: {
                    AccessToken: 'new-access-token',
                    IdToken: 'new-id-token',
                },
            });

            const response = await request(app)
                .post('/auth/refresh')
                .set('Cookie', 'refresh_token=valid-refresh-token');

            expect(response.status).toBe(200);
            expect(response.body.accessToken).toBe('new-access-token');
            expect(response.body.idToken).toBe('new-id-token');
        });

        it('returns 401 when no refresh cookie', async () => {
            const response = await request(app).post('/auth/refresh');

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('No refresh token');
        });

        it('returns 401 when refresh token is expired', async () => {
            cognitoMock.on(InitiateAuthCommand).rejects(new Error('Token expired'));

            const response = await request(app)
                .post('/auth/refresh')
                .set('Cookie', 'refresh_token=expired-token');

            expect(response.status).toBe(401);
        });
    });

    describe('POST /auth/signout', () => {
        it('clears the refresh cookie', async () => {
            const response = await request(app).post('/auth/signout');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Signed out');
            const cookies = response.headers['set-cookie'];
            const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
            // Cookie should be cleared (expires in the past)
            expect(cookieStr).toContain('refresh_token=');
        });
    });
});
