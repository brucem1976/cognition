import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import '@testing-library/jest-dom';

// Mock components to avoid needing their dependencies in App test
jest.mock('./features/auth/SignUp', () => () => <div>SignUp Component</div>);
jest.mock('./features/auth/SignIn', () => () => <div>SignIn Component</div>);
jest.mock('./features/auth/ForgotPassword', () => () => <div>ForgotPassword Component</div>);

describe('App Routing', () => {
    it('renders SignIn at /signin', () => {
        render(
            <MemoryRouter initialEntries={['/signin']}>
                <App />
            </MemoryRouter>
        );
        expect(screen.getByText('SignIn Component')).toBeInTheDocument();
    });

    it('renders SignUp at /signup', () => {
        render(
            <MemoryRouter initialEntries={['/signup']}>
                <App />
            </MemoryRouter>
        );
        expect(screen.getByText('SignUp Component')).toBeInTheDocument();
    });

    it('renders ForgotPassword at /forgot-password', () => {
        render(
            <MemoryRouter initialEntries={['/forgot-password']}>
                <App />
            </MemoryRouter>
        );
        expect(screen.getByText('ForgotPassword Component')).toBeInTheDocument();
    });

    it('renders Home at root', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>
        );
        expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });
});
