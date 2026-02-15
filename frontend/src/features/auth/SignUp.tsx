import React, { useState } from 'react';
import { CognitoService } from '../../auth/CognitoService';

const SignUp: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [step, setStep] = useState<'signup' | 'confirm'>('signup');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const result = await CognitoService.signUp(email, password, phone);
            if (!result.UserConfirmed) {
                setStep('confirm');
                setMessage('Please enter the verification code sent to your email.');
            } else {
                setMessage('Sign up successful! Please sign in.');
            }
        } catch (err: any) {
            setError(err.message || 'Sign up failed');
        }
    };

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await CognitoService.confirmSignUp(email, verificationCode);
            setMessage('Verification successful! You can now sign in.');
            // Optionally redirect or clear form
        } catch (err: any) {
            setError(err.message || 'Verification failed');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded shadow-md w-96">
                <h2 className="mb-6 text-2xl font-bold text-center">
                    {step === 'signup' ? 'Sign Up' : 'Verify Account'}
                </h2>
                {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}
                {message && <div className="mb-4 text-green-500 text-sm">{message}</div>}

                {step === 'signup' ? (
                    <form onSubmit={handleSignUp} className="flex flex-col gap-4">
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
                        <input
                            type="tel"
                            placeholder="Phone Number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="p-2 border rounded"
                            required
                        />
                        <button
                            type="submit"
                            className="p-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                        >
                            Sign Up
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleConfirm} className="flex flex-col gap-4">
                        <div className="text-sm text-gray-600 mb-2">
                            Enter verification code sent to {email}
                        </div>
                        <input
                            type="text"
                            placeholder="Enter Verification Code"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            className="p-2 border rounded"
                            required
                        />
                        <button
                            type="submit"
                            className="p-2 text-white bg-green-600 rounded hover:bg-green-700"
                        >
                            Verify
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default SignUp;
