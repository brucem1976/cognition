import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ForgotPassword from './ForgotPassword';
import { CognitoService } from '../../auth/CognitoService';

// Mock CognitoService
jest.mock('../../auth/CognitoService', () => ({
    CognitoService: {
        forgotPassword: jest.fn(),
        confirmForgotPassword: jest.fn()
    }
}));

describe('ForgotPassword Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders forgot password form', () => {
        render(<ForgotPassword />);
        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });

    it('calls CognitoService.forgotPassword on submit', async () => {
        const mockForgotPassword = CognitoService.forgotPassword as jest.Mock;
        mockForgotPassword.mockResolvedValue({});

        render(<ForgotPassword />);

        fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

        await waitFor(() => {
            expect(mockForgotPassword).toHaveBeenCalledWith('test@example.com');
        });
    });

    it('shows confirmation step after successful request', async () => {
        const mockForgotPassword = CognitoService.forgotPassword as jest.Mock;
        mockForgotPassword.mockResolvedValue({});

        render(<ForgotPassword />);

        fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/verification code/i)).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/new password/i)).toBeInTheDocument();
        });
    });

    it('calls CognitoService.confirmForgotPassword on confirmation submit', async () => {
        const mockForgotPassword = CognitoService.forgotPassword as jest.Mock;
        const mockConfirmForgotPassword = CognitoService.confirmForgotPassword as jest.Mock;

        mockForgotPassword.mockResolvedValue({});
        mockConfirmForgotPassword.mockResolvedValue({});

        render(<ForgotPassword />);

        // Step 1
        fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/verification code/i)).toBeInTheDocument();
        });

        // Step 2
        fireEvent.change(screen.getByPlaceholderText(/verification code/i), { target: { value: '123456' } });
        fireEvent.change(screen.getByPlaceholderText(/new password/i), { target: { value: 'NewPassword123!' } });
        fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

        await waitFor(() => {
            expect(mockConfirmForgotPassword).toHaveBeenCalledWith('test@example.com', '123456', 'NewPassword123!');
        });
    });
});
