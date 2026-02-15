import { CognitoService } from './CognitoService';
import {
    CognitoIdentityProviderClient,
    SignUpCommand,
    ForgotPasswordCommand,
    ConfirmForgotPasswordCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { mockClient } from 'aws-sdk-client-mock';

const cognitoMock = mockClient(CognitoIdentityProviderClient);

// Mock global fetch for backend proxy calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('CognitoService', () => {
    beforeEach(() => {
        cognitoMock.reset();
        mockFetch.mockReset();
    });

    // --- Direct Cognito SDK calls ---

    it('should sign up a user successfully', async () => {
        cognitoMock.on(SignUpCommand).resolves({
            UserConfirmed: false,
            UserSub: '12345678-1234-1234-1234-123456789012'
        });

        const result = await CognitoService.signUp('test@example.com', 'Password123!', '+15555555555');

        expect(result.UserSub).toBe('12345678-1234-1234-1234-123456789012');
        expect(result.UserConfirmed).toBe(false);
        expect(cognitoMock.calls()).toHaveLength(1);
    });

    it('should initiate forgot password', async () => {
        cognitoMock.on(ForgotPasswordCommand).resolves({
            CodeDeliveryDetails: {
                Destination: 'test@example.com',
                DeliveryMedium: 'EMAIL',
                AttributeName: 'email'
            }
        });

        const result = await CognitoService.forgotPassword('test@example.com');
        expect(result.CodeDeliveryDetails?.Destination).toBe('test@example.com');
    });

    it('should confirm forgot password', async () => {
        cognitoMock.on(ConfirmForgotPasswordCommand).resolves({});

        await CognitoService.confirmForgotPassword('test@example.com', '123456', 'NewPassword123!');
        expect(cognitoMock.calls()).toHaveLength(1);
    });

    // --- Backend proxy calls (mocking fetch) ---

    it('should sign in via backend proxy', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ accessToken: 'access-123', idToken: 'id-123' }),
        });

        const result = await CognitoService.signIn('test@example.com', 'Password123!');

        expect(result.accessToken).toBe('access-123');
        expect(result.idToken).toBe('id-123');
        expect(mockFetch).toHaveBeenCalledWith('/auth/signin', expect.objectContaining({
            method: 'POST',
            credentials: 'include',
        }));
    });

    it('should throw on sign in failure', async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            json: async () => ({ error: 'Invalid credentials' }),
        });

        await expect(CognitoService.signIn('test@example.com', 'wrong'))
            .rejects.toThrow('Invalid credentials');
    });

    it('should refresh token via backend proxy', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ accessToken: 'new-access', idToken: 'new-id' }),
        });

        const result = await CognitoService.refreshToken();

        expect(result.accessToken).toBe('new-access');
        expect(mockFetch).toHaveBeenCalledWith('/auth/refresh', expect.objectContaining({
            method: 'POST',
            credentials: 'include',
        }));
    });

    it('should sign out via backend proxy', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ message: 'Signed out' }),
        });

        const result = await CognitoService.signOut();

        expect(result.message).toBe('Signed out');
        expect(mockFetch).toHaveBeenCalledWith('/auth/signout', expect.objectContaining({
            method: 'POST',
            credentials: 'include',
        }));
    });
});
