import { CognitoService } from './CognitoService';
import {
    CognitoIdentityProviderClient,
    SignUpCommand,
    InitiateAuthCommand,
    ForgotPasswordCommand,
    ConfirmForgotPasswordCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { mockClient } from 'aws-sdk-client-mock';

const cognitoMock = mockClient(CognitoIdentityProviderClient);

describe('CognitoService', () => {
    beforeEach(() => {
        cognitoMock.reset();
        // Clear storage
        localStorage.clear();
    });

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

    it('should sign in a user and store tokens', async () => {
        cognitoMock.on(InitiateAuthCommand).resolves({
            AuthenticationResult: {
                AccessToken: 'access-token',
                IdToken: 'id-token',
                RefreshToken: 'refresh-token'
            }
        });

        const result = await CognitoService.signIn('test@example.com', 'Password123!');

        expect(result.AuthenticationResult?.AccessToken).toBe('access-token');
        // Check if tokens are stored (implementation detail, but good to verify behavior)
        expect(localStorage.getItem('access_token')).toBe('access-token');
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
});
