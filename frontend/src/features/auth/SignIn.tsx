import React, { useState } from 'react';
import { CognitoService } from '../../auth/CognitoService';
import MFAVerification from './MFAVerification';

const SignIn: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [step, setStep] = useState<'signin' | 'mfa'>('signin');
    const [challengeName, setChallengeName] = useState('');
    const [session, setSession] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const result = await CognitoService.signIn(email, password);
            if (result.AuthenticationResult) {
                console.log('Sign in successful', result);
                // Handle success (redirect, etc.)
            } else if (result.ChallengeName) {
                setChallengeName(result.ChallengeName);
                setSession(result.Session || '');
                setStep('mfa');
            }
        } catch (err: any) {
            setError(err.message || 'Sign in failed');
        }
    };

    const handleMFASuccess = (result: any) => {
        console.log('MFA successful', result);
        // Handle success
    };

    if (step === 'mfa') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
                <div className="p-8 bg-white rounded shadow-md w-96">
                    <MFAVerification
                        session={session}
                        username={email}
                        challengeName={challengeName}
                        onSuccess={handleMFASuccess}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded shadow-md w-96">
                <h2 className="mb-6 text-2xl font-bold text-center">Sign In</h2>
                {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="p-2 border rounded"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="p-2 border rounded"
                        required
                    />
                    <button
                        type="submit"
                        className="p-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SignIn;
