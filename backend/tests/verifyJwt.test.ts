import request from 'supertest';
import { createApp } from '../src/app';
import * as jose from 'jose';

const app = createApp();

// Mock jose.jwtVerify and jose.createRemoteJWKSet
jest.mock('jose', () => {
    const actual = jest.requireActual('jose');
    return {
        ...actual,
        createRemoteJWKSet: jest.fn().mockReturnValue('mock-jwks'),
        jwtVerify: jest.fn(),
    };
});

const mockedJwtVerify = jose.jwtVerify as jest.MockedFunction<typeof jose.jwtVerify>;

describe('JWT Middleware & Protected Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/me', () => {
        it('returns 401 when no Authorization header', async () => {
            const response = await request(app).get('/api/me');

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Missing or invalid Authorization header');
        });

        it('returns 401 when Authorization header is not Bearer', async () => {
            const response = await request(app)
                .get('/api/me')
                .set('Authorization', 'Basic abc123');

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Missing or invalid Authorization header');
        });

        it('returns 401 when token is invalid', async () => {
            mockedJwtVerify.mockRejectedValue(new Error('invalid token'));

            const response = await request(app)
                .get('/api/me')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid or expired token');
        });

        it('returns 401 when token_use is not access', async () => {
            mockedJwtVerify.mockResolvedValue({
                payload: {
                    sub: 'user-123',
                    token_use: 'id', // wrong type
                    username: 'test@example.com',
                },
                protectedHeader: { alg: 'RS256' },
            } as any);

            const response = await request(app)
                .get('/api/me')
                .set('Authorization', 'Bearer valid-id-token');

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid token type');
        });

        it('returns user claims when token is valid', async () => {
            mockedJwtVerify.mockResolvedValue({
                payload: {
                    sub: 'user-123',
                    token_use: 'access',
                    username: 'test@example.com',
                    scope: 'openid profile',
                },
                protectedHeader: { alg: 'RS256' },
            } as any);

            const response = await request(app)
                .get('/api/me')
                .set('Authorization', 'Bearer valid-access-token');

            expect(response.status).toBe(200);
            expect(response.body.sub).toBe('user-123');
            expect(response.body.username).toBe('test@example.com');
            expect(response.body.tokenUse).toBe('access');
            expect(response.body.scope).toBe('openid profile');
        });
    });
});
