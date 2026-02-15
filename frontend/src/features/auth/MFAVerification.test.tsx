import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MFAVerification from './MFAVerification';
import { CognitoService } from '../../auth/CognitoService';

// Mock CognitoService
jest.mock('../../auth/CognitoService', () => ({
    CognitoService: {
        respondToAuthChallenge: jest.fn()
    }
}));

describe('MFAVerification Component', () => {
    const mockOnSuccess = jest.fn();
    const mockSession = 'session-123';
    const mockUsername = 'test@example.com';
    const mockChallengeName = 'SMS_MFA';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders MFA form', () => {
        render(<MFAVerification
            session={mockSession}
            username={mockUsername}
            challengeName={mockChallengeName}
            onSuccess={mockOnSuccess}
        />);
        expect(screen.getByPlaceholderText(/code/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument();
    });

    it('calls CognitoService.respondToAuthChallenge on submit', async () => {
        const mockRespond = CognitoService.respondToAuthChallenge as jest.Mock;
        mockRespond.mockResolvedValue({ accessToken: 'token', idToken: 'id-token' });

        render(<MFAVerification
            session={mockSession}
            username={mockUsername}
            challengeName={mockChallengeName}
            onSuccess={mockOnSuccess}
        />);

        fireEvent.change(screen.getByPlaceholderText(/code/i), { target: { value: '123456' } });
        fireEvent.click(screen.getByRole('button', { name: /verify/i }));

        await waitFor(() => {
            expect(mockRespond).toHaveBeenCalledWith(
                mockChallengeName,
                '123456',
                mockSession,
                mockUsername
            );
            expect(mockOnSuccess).toHaveBeenCalled();
        });
    });
});
