import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignIn from './SignIn';
import { CognitoService } from '../../auth/CognitoService';

// Mock CognitoService
jest.mock('../../auth/CognitoService', () => ({
    CognitoService: {
        signIn: jest.fn()
    }
}));

describe('SignIn Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders sign in form', () => {
        render(<SignIn />);
        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('calls CognitoService.signIn on submit', async () => {
        const mockSignIn = CognitoService.signIn as jest.Mock;
        mockSignIn.mockResolvedValue({ accessToken: 'token', idToken: 'id-token' });

        render(<SignIn />);

        fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'Password123!' } });

        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'Password123!');
        });
    });

    it('displays error message on failure', async () => {
        const mockSignIn = CognitoService.signIn as jest.Mock;
        mockSignIn.mockRejectedValue(new Error('Sign in failed'));

        render(<SignIn />);

        fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'Password123!' } });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(screen.getByText(/sign in failed/i)).toBeInTheDocument();
        });
    });

    it('shows MFA verification when challenge is returned', async () => {
        const mockSignIn = CognitoService.signIn as jest.Mock;
        mockSignIn.mockResolvedValue({
            challengeName: 'SMS_MFA',
            session: 'session-123',
        });

        render(<SignIn />);

        fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'Password123!' } });

        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(screen.getByText(/mfa verification/i)).toBeInTheDocument();
        });
    });
});
