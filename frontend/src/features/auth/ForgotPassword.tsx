import React, { useState } from 'react';
import { CognitoService } from '../../auth/CognitoService';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [step, setStep] = useState<'request' | 'confirm'>('request');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await CognitoService.forgotPassword(email);
            setStep('confirm');
            setMessage(`Verification code sent to ${email}`);
        } catch (err: any) {
            setError(err.message || 'Request failed');
        }
    };

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await CognitoService.confirmForgotPassword(email, verificationCode, newPassword);
            setMessage('Password reset successful! You can now sign in.');
            // Optionally redirect
        } catch (err: any) {
            setError(err.message || 'Reset failed');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded shadow-md w-96">
                <h2 className="mb-6 text-2xl font-bold text-center">
                    {step === 'request' ? 'Reset Password' : 'Confirm Password'}
                </h2>
                {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}
                {message && <div className="mb-4 text-green-500 text-sm">{message}</div>}

                {step === 'request' ? (
                    <form onSubmit={handleRequest} className="flex flex-col gap-4">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="p-2 border rounded"
                            required
                        />
                        <button
                            type="submit"
                            className="p-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                        >
                            Reset Password
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleConfirm} className="flex flex-col gap-4">
                        <input
                            type="text"
                            placeholder="Verification Code"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            className="p-2 border rounded"
                            required
                        />
                        <input
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="p-2 border rounded"
                            required
                        />
                        <button
                            type="submit"
                            className="p-2 text-white bg-green-600 rounded hover:bg-green-700"
                        >
                            Confirm
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
