import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignUp from './SignUp';
import { CognitoService } from '../../auth/CognitoService';

// Mock CognitoService
jest.mock('../../auth/CognitoService', () => ({
    CognitoService: {
        signUp: jest.fn()
    }
}));

describe('SignUp Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders sign up form', () => {
        render(<SignUp />);
        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/phone/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('calls CognitoService.signUp on submit', async () => {
        const mockSignUp = CognitoService.signUp as jest.Mock;
        mockSignUp.mockResolvedValue({ UserConfirmed: false });

        render(<SignUp />);

        fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'Password123!' } });
        fireEvent.change(screen.getByPlaceholderText(/phone/i), { target: { value: '+15555555555' } });

        fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

        await waitFor(() => {
            expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'Password123!', '+15555555555');
        });
    });

    it('displays error message on failure', async () => {
        const mockSignUp = CognitoService.signUp as jest.Mock;
        mockSignUp.mockRejectedValue(new Error('Sign up failed'));

        render(<SignUp />);

        fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'short' } });
        fireEvent.change(screen.getByPlaceholderText(/phone/i), { target: { value: '123' } });

        fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

        await waitFor(() => {
            expect(screen.getByText(/sign up failed/i)).toBeInTheDocument();
        });
    });
    it('shows verification step after successful sign up if not confirmed', async () => {
        const mockSignUp = CognitoService.signUp as jest.Mock;
        mockSignUp.mockResolvedValue({ UserConfirmed: false, UserSub: '123' });

        render(<SignUp />);

        fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'Password123!' } });
        fireEvent.change(screen.getByPlaceholderText(/phone/i), { target: { value: '+15555555555' } });

        fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

        await waitFor(() => {
            expect(screen.getByText(/enter verification code/i)).toBeInTheDocument();
        });
    });
});
