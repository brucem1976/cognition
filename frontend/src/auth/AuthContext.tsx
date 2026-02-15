import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CognitoService } from './CognitoService';

interface AuthState {
    accessToken: string | null;
    idToken: string | null;
    isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
    signIn: (email: string, password: string) => Promise<any>;
    signOut: () => Promise<void>;
    refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authState, setAuthState] = useState<AuthState>({
        accessToken: null,
        idToken: null,
        isAuthenticated: false,
    });

    const signIn = useCallback(async (email: string, password: string) => {
        const result = await CognitoService.signIn(email, password);

        if (result.accessToken) {
            setAuthState({
                accessToken: result.accessToken,
                idToken: result.idToken,
                isAuthenticated: true,
            });
        }

        return result; // may contain challengeName for MFA
    }, []);

    const signOut = useCallback(async () => {
        await CognitoService.signOut();
        setAuthState({
            accessToken: null,
            idToken: null,
            isAuthenticated: false,
        });
    }, []);

    const refreshToken = useCallback(async (): Promise<boolean> => {
        try {
            const result = await CognitoService.refreshToken();
            if (result.accessToken) {
                setAuthState(prev => ({
                    ...prev,
                    accessToken: result.accessToken,
                    idToken: result.idToken,
                }));
                return true;
            }
            return false;
        } catch {
            setAuthState({
                accessToken: null,
                idToken: null,
                isAuthenticated: false,
            });
            return false;
        }
    }, []);

    const value = useMemo(() => ({
        ...authState,
        signIn,
        signOut,
        refreshToken,
    }), [authState, signIn, signOut, refreshToken]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

/**
 * Make an authenticated API call with automatic token refresh on 401.
 */
export async function authenticatedFetch(
    url: string,
    options: RequestInit = {},
    auth: AuthContextType
): Promise<Response> {
    const makeRequest = (token: string | null) => {
        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: 'include',
        });
    };

    let response = await makeRequest(auth.accessToken);

    // If 401, try refreshing the token and retrying once
    if (response.status === 401) {
        const refreshed = await auth.refreshToken();
        if (refreshed) {
            response = await makeRequest(auth.accessToken);
        }
    }

    return response;
}
